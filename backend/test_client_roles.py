from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.core.security import hash_password

client = TestClient(app)


def create_internal_admin_token():
    """Helper to seed an internal admin in PostgreSQL and return JWT headers."""
    db = SessionLocal()
    from app.models.user import User

    existing = db.query(User).filter(User.email == "internal_admin@system.com").first()
    if not existing:
        admin_user = User(
            email="internal_admin@system.com",
            username="sysadmin_test",
            hashed_password=hash_password("adminpass123"),
            role="internal_admin",
            status="active",
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        db.commit()
    db.close()

    # Log in to retrieve token
    res = client.post(
        "/auth/login",
        data={"username": "internal_admin@system.com", "password": "adminpass123"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


import uuid


def test_full_multi_tenant_flow():
    admin_headers = create_internal_admin_token()

    uid = uuid.uuid4().hex[:6]
    acme_name = f"Acme Textiles {uid}"
    acme_boss_email = f"boss_{uid}@acmetextiles.com"
    acme_emp_email = f"emp_{uid}@acmetextiles.com"
    globex_name = f"Globex Corp {uid}"
    globex_admin_email = f"admin_{uid}@globex.com"

    # 1. Internal Admin creates Tenant 1 (Acme Textiles)
    res = client.post(
        "/admin/organizations",
        headers=admin_headers,
        json={"name": acme_name, "domain": f"acme_{uid}.com"},
    )
    assert res.status_code == 200, res.text
    acme_org_id = res.json()["id"]

    # 2. Internal Admin invites Org Admin for Acme
    res = client.post(
        f"/admin/organizations/{acme_org_id}/invite",
        headers=admin_headers,
        json={"email": acme_boss_email},
    )
    assert res.status_code == 200, res.text
    invite_token = res.json()["invite_token"]

    # 3. Public token check
    res = client.get(f"/invites/{invite_token}")
    assert res.status_code == 200, res.text
    assert res.json()["organization_name"] == acme_name
    assert res.json()["is_valid"] is True

    # 4. Org Admin accepts invite
    res = client.post(
        f"/invites/{invite_token}/accept",
        json={
            "username": f"acme_boss_{uid}",
            "full_name": "Acme Manager",
            "password": "Password123!",
        },
    )
    assert res.status_code == 200, res.text

    # 5. Org Admin logs in
    res = client.post(
        "/auth/login",
        data={"username": acme_boss_email, "password": "Password123!"},
    )
    assert res.status_code == 200, res.text
    acme_boss_token = res.json()["access_token"]
    acme_boss_headers = {"Authorization": f"Bearer {acme_boss_token}"}

    # 6. Org Admin invites a colleague (client_member)
    res = client.post(
        "/client/team/invite",
        headers=acme_boss_headers,
        json={"email": acme_emp_email},
    )
    assert res.status_code == 200, res.text
    emp_token = res.json()["invite_token"]

    # Accept teammate invite
    client.post(
        f"/invites/{emp_token}/accept",
        json={"username": f"acme_emp_{uid}", "password": "Password123!"},
    )

    # Teammate logs in
    res = client.post(
        "/auth/login",
        data={"username": acme_emp_email, "password": "Password123!"},
    )
    acme_emp_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # 7. Teammate creates an issue for Acme Textiles
    res = client.post(
        "/client/issues",
        headers=acme_emp_headers,
        json={
            "title": "ERP Invoice PDF alignment issue",
            "description": "Invoice totals overlap on page 2",
            "priority": "high",
        },
    )
    assert res.status_code == 200, res.text
    issue_data = res.json()
    assert issue_data["title"] == "ERP Invoice PDF alignment issue"

    # Privacy check: Ensure internal assigned fields are not present in client schema
    assert "assigned_to" not in issue_data
    assert "assignee_id" not in issue_data

    # 8. Create Tenant 2 (Globex Corp) & verify Multi-Tenant Data Isolation
    res = client.post(
        "/admin/organizations",
        headers=admin_headers,
        json={"name": globex_name, "domain": f"globex_{uid}.com"},
    )
    globex_org_id = res.json()["id"]

    res = client.post(
        f"/admin/organizations/{globex_org_id}/invite",
        headers=admin_headers,
        json={"email": globex_admin_email},
    )
    globex_invite_token = res.json()["invite_token"]

    client.post(
        f"/invites/{globex_invite_token}/accept",
        json={"username": f"globex_admin_{uid}", "password": "Password123!"},
    )

    globex_login = client.post(
        "/auth/login",
        data={"username": globex_admin_email, "password": "Password123!"},
    )
    globex_headers = {"Authorization": f"Bearer {globex_login.json()['access_token']}"}

    # Globex queries /client/issues -> Should receive 0 issues (cannot see Acme's issues!)
    res = client.get("/client/issues", headers=globex_headers)
    assert res.status_code == 200, res.text
    assert len(res.json()) == 0

    # Acme queries /client/issues -> Sees their 1 issue
    res = client.get("/client/issues", headers=acme_boss_headers)
    assert res.status_code == 200, res.text
    assert len(res.json()) == 1
    assert res.json()[0]["title"] == "ERP Invoice PDF alignment issue"
