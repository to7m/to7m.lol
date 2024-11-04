from pathlib import Path
import shutil
import subprocess


DIR_ = Path(__file__).parent
VERSION_STRING_PATH = DIR_ / "version_string.txt"
SRC_DIR = DIR_ / "src"
SERVER_TEMPLATE_DIR = SRC_DIR / "server_template"
DIST_DIR = DIR_ / "dist"

VERSION_STRING = str(int(VERSION_STRING_PATH.read_text()) + 1)
VERSION_STRING_PATH.write_text(VERSION_STRING)


def remove_old_dist_dir():
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)


def copy_and_fill_in_template(src, dst):
    if src.is_dir():
        dst.mkdir()

        for src_child in src.iterdir():
            dst_child = dst / src_child.name
            copy_and_fill_in_template(src_child, dst_child)
    else:
        shutil.copy(src, dst)

        if dst.suffix in [".html", ".php", ".js"]:
            old_text = dst.read_text()
            new_text = old_text.replace("!VERSION_STRING", VERSION_STRING)
            dst.write_text(new_text)


remove_old_dist_dir()
copy_and_fill_in_template(SERVER_TEMPLATE_DIR, DIST_DIR)
