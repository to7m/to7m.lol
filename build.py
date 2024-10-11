from pathlib import Path


dir_ = Path(__file__)
(dir_ / "test").write_text("test")
