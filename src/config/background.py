from dataclasses import dataclass

from src.modules.background import BackgroundEffect


@dataclass
class BackgroundConfig:
    effect: BackgroundEffect

    def asdict(self):
        return {
            "effect": self.effect,
        }
