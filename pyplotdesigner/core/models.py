__copyright__ = """Copyright (C) 2025 George N. Wong"""
__license__ = """
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""


class Variable:
    def __init__(self, owner, attr):
        self.owner = owner
        self.attr = attr

    def get(self):
        return getattr(self.owner, self.attr)

    def set(self, value):
        setattr(self.owner, self.attr, value)

    def to_dict(self):
        d = dict(id=None, attr=None)
        if isinstance(self.owner, Constant):
            d['id'] = self.owner.id
            d['attr'] = None
            return d
        d['id'] = self.owner.id
        d['attr'] = self.attr[1:]
        return d

    def __hash__(self):
        return hash((id(self.owner), self.attr))

    def __eq__(self, other):
        return isinstance(other, Variable) and \
            self.owner is other.owner and \
            self.attr == other.attr

    def __repr__(self):
        return f"{self.owner.id}.{self.attr}"


class ComputedVariable(Variable):
    def __init__(self, owner, attr, get_fn, set_fn, label=None):
        super().__init__(owner=owner, attr=attr)
        self._get_fn = get_fn
        self._set_fn = set_fn
        self.label = label or "computed"

    def get(self):
        return self._get_fn()

    def set(self, value):
        self._set_fn(value)

    def to_dict(self):
        return {"id": self.owner.id, "attr": self.attr[1:]}

    def __repr__(self):
        return f"{self.owner.id}.{self.attr}"


class Constant:
    def __init__(self, id, value):
        self.id = id
        self._value = value
        self.value = Variable(self, "_value")

    def __repr__(self):
        return f"Constant(id={self.id}, value={self._value})"

    def to_dict(self):
        return {
            "id": self.id,
            "value": self._value
        }


class Element:
    def __init__(self, id, x, y, width, height, type, text=""):
        self.id = id
        self._x = x
        self._y = y
        self._width = width
        self._height = height
        self.type = type
        self.text = text

        # expose symbolic refs
        self.x = Variable(self, "_x")
        self.y = Variable(self, "_y")
        self.width = Variable(self, "_width")
        self.height = Variable(self, "_height")

        # add aliases
        self.bottom = self.y
        self.left = self.x

        # add computed variables
        self.right = ComputedVariable(
            owner=self,
            attr="_right",
            get_fn=lambda: self._x + self._width,
            set_fn=lambda val: setattr(self, "_x", val - self._width)
        )

        self.top = ComputedVariable(
            owner=self,
            attr="_top",
            get_fn=lambda: self._y + self._height,
            set_fn=lambda val: setattr(self, "_y", val - self._height)
        )

        self.center_x = ComputedVariable(
            owner=self,
            attr="_center_x",
            get_fn=lambda: self._x + self._width / 2,
            set_fn=lambda val: setattr(self, "_x", val - self._width / 2)
        )

        self.center_y = ComputedVariable(
            owner=self,
            attr="_center_y",
            get_fn=lambda: self._y + self._height / 2,
            set_fn=lambda val: setattr(self, "_y", val - self._height / 2)
        )

    def get_valid_attributes(self):
        return ['x', 'y', 'width', 'height',
                'left', 'top', 'right', 'bottom', 'center_x', 'center_y']

    def __repr__(self):
        return f"Element(id={self.id}, type={self.type}, x={self._x}, y={self._y}, " \
            f"width={self._width}, height={self._height}, text='{self.text}')"

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "x": self._x,
            "y": self._y,
            "width": self._width,
            "height": self._height,
            "text": self.text
        }


class SetValueConstraint:
    def __init__(self, target, source, multiply=1.0, add_before=0.0, add_after=0.0):
        self.target = target
        self.source = source
        self.multiply = multiply
        self.add_before = add_before
        self.add_after = add_after

    def _resolve(self, value_or_var):
        return value_or_var.get() if hasattr(value_or_var, 'get') else value_or_var

    def includes_element(self, element):
        return self.target.owner == element or \
            (hasattr(self.source, 'owner') and self.source.owner == element) or \
            (isinstance(self.multiply, Variable) and self.multiply.owner == element) or \
            (isinstance(self.add_after, Variable) and self.add_after.owner == element) or \
            (isinstance(self.add_before, Variable) and self.add_before.owner == element)

    def apply(self):
        src = self._resolve(self.source)
        before = self._resolve(self.add_before)
        mult = self._resolve(self.multiply)
        after = self._resolve(self.add_after)

        if src is None:
            src = 0.

        result = (src + before) * mult + after
        self.target.set(result)

    def __repr__(self):
        return f"Constraint({self.target} = ({self.source} + " \
            f"{self.add_before}) * {self.multiply} + {self.add_after})"

    def _get_dict_for_attribute(self, attribute):
        d = dict(id=None, attr=None)
        if isinstance(attribute, Variable):
            d = attribute.to_dict()
        elif isinstance(attribute, (int, float)):
            d['attr'] = attribute
        return d

    def to_dict(self):
        d = {}
        d['target'] = self._get_dict_for_attribute(self.target)
        d['source'] = self._get_dict_for_attribute(self.source)
        d['multiply'] = self._get_dict_for_attribute(self.multiply)
        d['add_before'] = self._get_dict_for_attribute(self.add_before)
        d['add_after'] = self._get_dict_for_attribute(self.add_after)
        return d
