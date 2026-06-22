"""
Provider abstraction for the Stackadoo cartoon pipeline.

Each provider reads its API key from an ENVIRONMENT VARIABLE (never hardcoded,
never committed). The actual HTTP calls are STUBBED with TODOs — we wire the real
endpoints in together tomorrow once you've picked a provider and set a spend cap.

Nothing here spends a cent until (a) those TODOs are filled in AND (b) you run
generate.py with the explicit --go flag.
"""
import os


class Provider:
    name = "base"
    env_key = None

    def __init__(self):
        self.key = os.environ.get(self.env_key) if self.env_key else None
        if not self.key:
            raise SystemExit(
                f"❌ No API key found. Set {self.env_key} in your environment first "
                f"(and set a low spend cap on the provider dashboard)."
            )

    def generate(self, prompt, ref_image, out_path, duration=5, ratio="9:16"):
        """Generate ONE clip from prompt (+ optional reference image) → out_path (mp4)."""
        raise NotImplementedError


class Kling(Provider):
    name = "kling"
    env_key = "KLING_API_KEY"

    def generate(self, prompt, ref_image, out_path, duration=5, ratio="9:16"):
        # TODO (wire tomorrow): POST to Kling image2video / text2video with self.key,
        # poll the returned task id until status == succeeded, then download the mp4
        # to out_path. Direct Kling API or via a reseller (fal.ai / Replicate / PiAPI).
        raise NotImplementedError("Kling endpoint not wired yet — we'll do this together.")


class OpenAI(Provider):
    name = "openai"
    env_key = "OPENAI_API_KEY"

    def generate(self, prompt, ref_image, out_path, duration=5, ratio="9:16"):
        # TODO (wire tomorrow): OpenAI Sora video API — create job, poll, download.
        raise NotImplementedError("OpenAI Sora endpoint not wired yet.")


class XAI(Provider):
    name = "xai"
    env_key = "XAI_API_KEY"

    def generate(self, prompt, ref_image, out_path, duration=5, ratio="9:16"):
        # TODO (wire tomorrow): confirm xAI exposes a VIDEO endpoint (text/image is public;
        # "Grok Imagine" video API availability is unconfirmed) and wire if available.
        raise NotImplementedError("xAI video endpoint not confirmed/wired yet.")


def get_provider(name):
    return {"kling": Kling, "openai": OpenAI, "xai": XAI}[name]()
