"""API tests for the FairFare backend.

Run from the backend directory:  python -m pytest -q
"""

from datetime import date, timedelta
import uuid

import pytest
from fastapi.testclient import TestClient

import main

DEMO_EMAIL = "user@fairfare.in"
DEMO_PASSWORD = "demo12345"


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(main.app)


def _login(client: TestClient, email: str, password: str):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


# ---------------------------------------------------------------- system


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


# ------------------------------------------------------------------ auth


def test_demo_login_succeeds(client):
    res = _login(client, DEMO_EMAIL, DEMO_PASSWORD)
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"] and body["refresh_token"]


def test_wrong_password_rejected(client):
    assert _login(client, DEMO_EMAIL, "not-the-password").status_code == 401


@pytest.mark.parametrize("password", ["demo12345", "password"])
def test_unknown_email_cannot_use_former_master_passwords(client, password):
    """Regression: these passwords used to log any unknown email in."""
    res = _login(client, f"nobody-{uuid.uuid4().hex[:8]}@example.com", password)
    assert res.status_code == 401


def test_master_password_does_not_unlock_other_accounts(client):
    """Regression: 'demo12345' used to log into every registered account."""
    email = f"owner-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "a-real-strong-pass", "full_name": "Owner"},
    )
    assert reg.status_code == 201
    assert _login(client, email, "demo12345").status_code == 401
    assert _login(client, email, "a-real-strong-pass").status_code == 200


def test_me_returns_the_authenticated_user(client):
    email = f"me-{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "another-strong-pass", "full_name": "Me Myself"},
    )
    token = _login(client, email, "another-strong-pass").json()["access_token"]
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == email
    assert res.json()["full_name"] == "Me Myself"


def test_refresh_token_is_not_accepted_as_bearer(client):
    refresh = _login(client, DEMO_EMAIL, DEMO_PASSWORD).json()["refresh_token"]
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert res.status_code == 401


def test_refresh_flow_issues_new_tokens(client):
    refresh = _login(client, DEMO_EMAIL, DEMO_PASSWORD).json()["refresh_token"]
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_access_token_rejected_by_refresh_endpoint(client):
    access = _login(client, DEMO_EMAIL, DEMO_PASSWORD).json()["access_token"]
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": access})
    assert res.status_code == 401


def test_garbage_token_rejected(client):
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert res.status_code == 401


def test_me_requires_credentials(client):
    assert client.get("/api/v1/auth/me").status_code == 401


# --------------------------------------------------------- search / data


def test_airport_search(client):
    res = client.get("/api/v1/airports/search", params={"query": "DEL"})
    assert res.status_code == 200
    assert any("DEL" in str(item) for item in res.json())


def test_suppliers_listed(client):
    res = client.get("/api/v1/suppliers")
    assert res.status_code == 200
    assert len(res.json()) > 0


def test_flight_search(client):
    depart = date.today() + timedelta(days=30)
    res = client.post(
        "/api/v1/search",
        json={
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": depart.isoformat(),
            "adults": 1,
        },
    )
    assert res.status_code in (200, 201), res.text


def test_search_rejects_bad_iata(client):
    depart = date.today() + timedelta(days=30)
    res = client.post(
        "/api/v1/search",
        json={"origin": "DELHI", "destination": "BOM", "departure_date": depart.isoformat()},
    )
    assert res.status_code == 422
