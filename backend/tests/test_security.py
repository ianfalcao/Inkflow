from app.core.security import hash_password, verify_password


def test_password_hash_has_random_salt_and_rejects_wrong_password():
    first = hash_password("minha-senha-123")
    second = hash_password("minha-senha-123")
    assert first != second
    assert verify_password("minha-senha-123", first)
    assert not verify_password("outra-senha", first)
