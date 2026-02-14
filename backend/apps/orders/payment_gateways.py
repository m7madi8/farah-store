import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


@dataclass
class PaymentInitResult:
    external_id: str
    checkout_url: str


class BankGatewayInterface(Protocol):
    def initialize_card_payment(self, amount: Decimal, currency: str, order_public_id: str) -> PaymentInitResult:
        ...

    def verify_callback(self, payload: dict, signature: str) -> bool:
        ...

    def parse_callback(self, payload: dict) -> dict:
        ...


class MockBankGatewayAdapter:
    def initialize_card_payment(self, amount: Decimal, currency: str, order_public_id: str) -> PaymentInitResult:
        return PaymentInitResult(
            external_id=f"mock_{uuid.uuid4().hex[:18]}",
            checkout_url=f"/mock-payment/{order_public_id}",
        )

    def verify_callback(self, payload: dict, signature: str) -> bool:
        return bool(payload and signature == "mock-signature")

    def parse_callback(self, payload: dict) -> dict:
        return {
            "external_id": payload.get("external_id"),
            "status": payload.get("status", "captured"),
            "raw": payload,
        }
