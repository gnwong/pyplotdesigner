__copyright__ = """Copyright (C) 2023 George N. Wong"""
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


class EqualizeNetwork:


    ## TODO clean up
    class _Network:
        def __init__(self, constraint):
            if constraint.ploc in ['n', 's']:
                self.orientation = 'width'
            elif constraint.ploc in ['w', 'e']:
                self.orientation = 'height'
            else:
                raise Exception('Equalize constraint must have n,s,w,e ploc')
            self.elements = [constraint.parent, constraint.child]
            self.constraints = [constraint]
        def merge(self, network):
            if self.orientation != network.orientation:
                return False
            if not set(self.elements).isdisjoint(network.elements):
                for element in network.elements:
                    if element not in self.elements:
                        self.elements.append(element)
                for constraint in network.constraints:
                    if constraint not in self.constraints:
                        self.constraints.append(constraint)
                return True
            return False
    def __init__(self):
        self.networks = []
    def mergeNetworks(self):
        changed = False
        newNetworks = []
        for network in self.networks:
            skip = False
            for nnetwork in newNetworks:
                if nnetwork.merge(network):
                    skip = True
                    break
            if not skip:
                newNetworks.append(network)
        self.networks = newNetworks
    def addConstraint(self, constraint):
        self.networks.append(self._Network(constraint))
        self.mergeNetworks()
    def getUpdateList(self):
        updates = []
        for network in self.networks:
            elementScales = {}
            constraints = [c for c in network.constraints]
            constraint = constraints.pop(0)
            elementScales[constraint.parent] = 1.
            elementScales[constraint.child] = constraint.value
            for _ in range(len(constraints)):
                constraint = constraints.pop(0)
                if constraint.parent in elementScales:
                    if constraint.child in elementScales:
                        raise Exception('Multiple dependencies for equalize size')
                    elementScales[constraint.child] = elementScales[constraint.parent] * constraint.value
                elif constraint.child in elementScales:
                    elementScales[constraint.parent] = elementScales[constraint.child] / constraint.value
                else:
                    constraints.append(constraint)
                if len(constraints) == 0:
                    break
            elementNorm = sum([elementScales[key] for key in elementScales])
            elementActual = None
            if network.orientation == 'width':
                elementActual = sum([key.w for key in elementScales])
                for key in elementScales:
                    updates.append([key, 'n', elementScales[key] / elementNorm * elementActual])
            elif network.orientation == 'height':
                elementActual = sum([key.h for key in elementScales])
                for key in elementScales:
                    updates.append([key, 'w', elementScales[key] / elementNorm * elementActual])
        return updates
