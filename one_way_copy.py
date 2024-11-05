from pathlib import Path
import shutil


def delete_path(path):
    if path.is_dir():
        shutil.rmtree(path)
    else:
        path.unlink()


class Mode:
    def __init__(self, *, add, delete, overwrite):
        self.add, self.delete, self.overwrite = add, delete, overwrite
        self.children_mode = self

    def __str__(self):
        component_str = [
            "NEVER", "OVERWRITE_ONLY", "DELETE_ONLY", "DELETE_OR_OVERWRITE",
            "ADD_ONLY", "ADD_OR_OVERWRITE", "ADD_OR_DELETE", "ALWAYS"
        ][(self.add << 2) + (self.delete << 1) + self.overwrite]

        if self.children_mode is self:
            return component_str
        else:
            return f"{component_str}_THEN_{self.children_mode}"

    @classmethod
    def _from_component_str(cls, component_str, *, default_mode):
        match component_str:
            case "ALWAYS":
                return cls(add=True, delete=True, overwrite=True)
            case "NEVER":
                return cls(add=False, delete=False, overwrite=False)
            case "ADD_ONLY":
                return cls(add=True, delete=False, overwrite=False)
            case "DELETE_ONLY":
                return cls(add=False, delete=True, overwrite=False)
            case "OVERWRITE_ONLY":
                return cls(add=False, delete=False, overwrite=True)
            case "ADD_OR_DELETE":
                return cls(add=True, delete=True, overwrite=False)
            case "ADD_OR_OVERWRITE":
                return cls(add=True, delete=False, overwrite=True)
            case "DELETE_OR_OVERWRITE":
                return cls(add=False, delete=True, overwrite=True)
            case "INHERIT":
                return default_mode.copy()

    def copy(self):
        cls = type(self)

        inst = cls(add=self.add, delete=self.delete, overwrite=self.overwrite)

        if self.children_mode is not self:
            inst.children_mode = self.children_mode.copy()

        return inst

    @classmethod
    def from_mode_str(cls, mode_str, *, default_mode):
        then_i = mode_str.find("_THEN_")

        if then_i > 0:
            component_str = mode_str[:then_i]
            children_mode_str = mode_str[then_i + 6:]

            mode = cls._from_component_str(
                component_str,
                default_mode=default_mode
            )
            mode.children_mode = cls.from_mode_str(
                children_mode_str,
                default_mode=mode
            )
        else:
            mode = cls._from_component_str(
                mode_str,
                default_mode=default_mode
            )

        return mode

    @classmethod
    def from_obj(cls, obj):
        if type(obj) is str:
            return cls.from_mode_str(obj, default_mode=None)
        else:
            raise TypeError(f"cannot make Mode from {type(obj)} instance")

    @classmethod
    def process_filename(cls, src_filename, *, default_mode):
        dunder_i = src_filename.find("__")

        if dunder_i > 0:
            mode_str = src_filename[:dunder_i]
            dst_filename = src_filename[dunder_i + 2:]

            mode = cls.from_mode_str(mode_str, default_mode=default_mode)
        else:
            mode = default_mode.copy()
            dst_filename = src_filename

        return mode, dst_filename


class Node:
    def __init__(self, src_path, dst_path, *, mode):
        self.src_path = src_path
        self.dst_path = dst_path
        self.mode = mode
        self.children = list(self._get_children())

    def _get_children(self):
        cls = type(self)

        if not self.src_path.is_dir():
            return

        for child_src_path in self.src_path.iterdir():
            child_mode, child_dst_filename = Mode.process_filename(
                child_src_path.name, default_mode=self.mode.children_mode
            )
            child_dst_path = self.dst_path / child_dst_filename

            yield cls(child_src_path, child_dst_path, mode=child_mode)

    def _try_ensure_dst_dir(self):
        if self.dst_path.exists():
            if self.dst_path.is_dir():
                return True
            else:
                if self.mode.overwrite:
                    delete_path(self.dst_path)
                    self.dst_path.mkdir()
                    return True
                else:
                    return False
        else:
            if self.mode.add:
                self.dst_path.mkdir()
                return True
            else:
                return False

    def _delete_unexpected_children(self):
        expected_child_dst_paths = {child.dst_path for child in self.children}

        for child_dst_path in self.dst_path.iterdir():
            if child_dst_path not in expected_child_dst_paths:
                delete_path(child_dst_path)

    def _copy_dir(self):
        if self._try_ensure_dst_dir():
            if self.mode.delete:
                self._delete_unexpected_children()

            for child in self.children:
                child.perform_copy()

    def _copy_file(self):
        if self.dst_path.exists():
            if self.mode.overwrite:
                delete_path(self.dst_path)
                shutil.copy(self.src_path, self.dst_path)
        else:
            if self.mode.add:
                shutil.copy(self.src_path, self.dst_path)

    def perform_copy(self):
        if self.src_path.is_dir():
            self._copy_dir()
        else:
            self._copy_file()


def one_way_copy(src_path, dst_path, *, mode):
    src_path = Path(src_path)
    dst_path = Path(dst_path)
    mode = Mode.from_obj(mode)

    main_node = Node(src_path, dst_path, mode=mode)
    main_node.perform_copy()


##############################################################################


import sys


_, src_path, dst_path, mode = sys.argv
one_way_copy(src_path, dst_path, mode=mode)
