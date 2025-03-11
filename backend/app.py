# app.py - FastAPI Application
import os
import secrets
import sqlite3

import boto3
import git
from fastapi import Depends, FastAPI, HTTPException
from models import VM, Deployment, Environment, EnvVariable, Project
from redis import Redis
from rq import Queue
from worker import deploy, promote_to_production, rollback

# Setup
app = FastAPI(title="Hermes CI/CD")
redis_conn = Redis()
queue = Queue(connection=redis_conn)

SQLITE_DB_PATH = "hermes.db"


# Database setup
def init_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # Create tables
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS environments (
        id INTEGER PRIMARY KEY,
        project_id INTEGER,
        name TEXT NOT NULL,
        branch TEXT NOT NULL,
        is_production BOOLEAN DEFAULT 0,
        domain TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id)
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS env_variables (
        id INTEGER PRIMARY KEY,
        environment_id INTEGER,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        FOREIGN KEY (environment_id) REFERENCES environments (id)
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS deployments (
        id INTEGER PRIMARY KEY,
        project_id INTEGER,
        environment_id INTEGER,
        branch TEXT NOT NULL,
        commit_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        logs TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        url TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (environment_id) REFERENCES environments (id)
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS vms (
        id INTEGER PRIMARY KEY,
        instance_id TEXT NOT NULL,
        region TEXT NOT NULL,
        status TEXT NOT NULL,
        current_deployment_id INTEGER,
        FOREIGN KEY (current_deployment_id) REFERENCES deployments (id)
    )
    """
    )

    conn.commit()
    conn.close()


# Initialize the database
init_db()

# AWS Client
aws_client = boto3.client("ec2")


# Project endpoints
@app.get("/api/projects")
def get_projects():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects")
    projects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return projects


@app.post("/api/projects")
def create_project(project: Project):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO projects (name, repo_url) VALUES (?, ?)",
        (project.name, project.repo_url),
    )
    project_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Clone the repository for initial setup
    try:
        git.Repo.clone_from(project.repo_url, f"./repos/{project_id}")
    except Exception as e:
        return {"error": str(e), "id": project_id}

    return {"id": project_id, "name": project.name, "repo_url": project.repo_url}


@app.get("/api/projects/{project_id}")
def get_project(project_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get project
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    project = dict(cursor.fetchone())

    # Get environments
    cursor.execute("SELECT * FROM environments WHERE project_id = ?", (project_id,))
    environments = [dict(row) for row in cursor.fetchall()]

    # Get deployments
    cursor.execute(
        "SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT 10",
        (project_id,),
    )
    deployments = [dict(row) for row in cursor.fetchall()]

    conn.close()

    project["environments"] = environments
    project["deployments"] = deployments

    return project


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# Environment endpoints
@app.get(
    "/api/projects/{project_id}/environments",
)
def get_environments(project_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM environments WHERE project_id = ?", (project_id,))
    environments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return environments


@app.post(
    "/api/projects/{project_id}/environments",
)
def create_environment(project_id: int, environment: Environment):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO environments (project_id, name, branch, is_production, domain) VALUES (?, ?, ?, ?, ?)",
        (
            project_id,
            environment.name,
            environment.branch,
            environment.is_production,
            environment.domain,
        ),
    )
    env_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": env_id, **environment.dict()}


@app.get(
    "/api/projects/{project_id}/environments/{env_id}/variables",
)
def get_environment_variables(project_id: int, env_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT key, value FROM env_variables WHERE environment_id = ?", (env_id,)
    )
    variables = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return variables


@app.post(
    "/api/projects/{project_id}/environments/{env_id}/variables",
)
def create_environment_variable(project_id: int, env_id: int, variable: EnvVariable):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO env_variables (environment_id, key, value) VALUES (?, ?, ?)",
        (env_id, variable.key, variable.value),
    )
    var_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": var_id, **variable.dict()}


@app.delete(
    "/api/projects/{project_id}/environments/{env_id}/variables/{key}",
)
def delete_environment_variable(project_id: int, env_id: int, key: str):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM env_variables WHERE environment_id = ? AND key = ?", (env_id, key)
    )
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# Deployment endpoints
@app.get(
    "/api/projects/{project_id}/deployments",
)
def get_deployments(
    project_id: int, branch: str = "", limit: int = 10, status: str = ""
):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM deployments WHERE project_id = ?"
    params: list = [project_id]

    if branch:
        query += " AND branch = ?"
        params.append(branch)

    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    deployments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return deployments


@app.post(
    "/api/projects/{project_id}/deployments",
)
def create_deployment(project_id: int, deployment: Deployment):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # Get the environment for this branch
    cursor.execute(
        "SELECT id FROM environments WHERE project_id = ? AND branch = ?",
        (project_id, deployment.branch),
    )
    env_row = cursor.fetchone()

    if not env_row:
        conn.close()
        raise HTTPException(
            status_code=404, detail="Environment not found for this branch"
        )

    env_id = env_row[0]

    # Create the deployment record
    cursor.execute(
        "INSERT INTO deployments (project_id, environment_id, branch, commit_hash, status) VALUES (?, ?, ?, ?, ?)",
        (project_id, env_id, deployment.branch, deployment.commit_hash, "queued"),
    )
    deployment_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Queue the deployment job
    queue.enqueue(
        deploy,
        project_id,
        deployment_id,
        env_id,
        deployment.branch,
        deployment.commit_hash,
    )

    return {"id": deployment_id, "status": "queued"}


@app.get(
    "/api/projects/{project_id}/deployments/{deployment_id}",
)
def get_deployment(project_id: int, deployment_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM deployments WHERE id = ? AND project_id = ?",
        (deployment_id, project_id),
    )
    deployment = dict(cursor.fetchone()) if cursor.fetchone() else None
    conn.close()

    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    return deployment


@app.post(
    "/api/projects/{project_id}/deployments/{deployment_id}/approve",
)
def approve_deployment(project_id: int, deployment_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # Get the deployment
    cursor.execute(
        "SELECT environment_id, branch, commit_hash FROM deployments WHERE id = ? AND project_id = ?",
        (deployment_id, project_id),
    )
    deployment = cursor.fetchone()

    if not deployment:
        conn.close()
        raise HTTPException(status_code=404, detail="Deployment not found")

    env_id, branch, commit_hash = deployment

    # Check if this is for an "important" environment
    cursor.execute("SELECT is_production FROM environments WHERE id = ?", (env_id,))
    env = cursor.fetchone()

    if not env or not env[0]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="This deployment is not for a production environment",
        )

    conn.close()

    # Queue the promotion job
    queue.enqueue(promote_to_production, project_id, deployment_id)

    return {"status": "promotion queued"}


@app.post(
    "/api/projects/{project_id}/deployments/{deployment_id}/rollback",
)
def rollback_deployment(project_id: int, deployment_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # Check if deployment exists
    cursor.execute(
        "SELECT environment_id FROM deployments WHERE id = ? AND project_id = ?",
        (deployment_id, project_id),
    )
    deployment = cursor.fetchone()

    if not deployment:
        conn.close()
        raise HTTPException(status_code=404, detail="Deployment not found")

    env_id = deployment[0]
    conn.close()

    # Queue the rollback job
    queue.enqueue(rollback, project_id, deployment_id, env_id)

    return {"status": "rollback queued"}


# VM Management endpoints
@app.get("/api/vms")
def get_vms():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vms")
    vms = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Get additional details from AWS
    regions = set(vm["region"] for vm in vms)
    instance_details = {}

    for region in regions:
        regional_client = boto3.client("ec2", region_name=region)
        instance_ids = [vm["instance_id"] for vm in vms if vm["region"] == region]

        if instance_ids:
            response = regional_client.describe_instances(InstanceIds=instance_ids)
            for reservation in response["Reservations"]:
                for instance in reservation["Instances"]:
                    instance_details[instance["InstanceId"]] = {
                        "state": instance["State"]["Name"],
                        "public_ip": instance.get("PublicIpAddress", "N/A"),
                        "instance_type": instance["InstanceType"],
                    }

    # Enrich VM data
    for vm in vms:
        if vm["instance_id"] in instance_details:
            vm.update(instance_details[vm["instance_id"]])

    return vms


@app.post("/api/vms")
def register_vm(vm: VM):
    # Verify the instance exists
    regional_client = boto3.client("ec2", region_name=vm.region)
    try:
        response = regional_client.describe_instances(InstanceIds=[vm.instance_id])
        if not response["Reservations"]:
            raise HTTPException(status_code=404, detail="Instance not found in AWS")
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error checking instance: {str(e)}"
        )

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vms (instance_id, region, status) VALUES (?, ?, ?)",
        (vm.instance_id, vm.region, "available"),
    )
    vm_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"id": vm_id, **vm.dict(), "status": "available"}


@app.delete("/api/vms/{vm_id}")
def unregister_vm(vm_id: int):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vms WHERE id = ?", (vm_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
