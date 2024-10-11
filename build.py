from pathlib import Path


dir_ = Path(__file__).parent
(dir_ / "test").write_text("test")
