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
    """
    Collection of networks containing equalize constraints. Each network
    represents a set of elements that are reflexively equalized. Networks
    with the same orientation and shared elements are merged together.
    """

    class _Network:
        """
        Private class for storing a network of equalize constraints. Supports
        merging with other networks if they have the same orientation and share
        elements. Contains a list of constraints with ratios between dimensions 
        of elements that can be solved for the final dimensions of the elements.
        """

        def __init__(self, constraint):
            """
            Create a new network from a single constraint.

            :arg constraint: Equalize constraint to add to the network
            """

            if constraint.parent_anchor in ['n', 's']:
                self.orientation = 'width'
            elif constraint.parent_anchor in ['w', 'e']:
                self.orientation = 'height'
            else:
                raise Exception('Equalize constraint must have n,s,w,e parent anchor')

            self.elements = [constraint.parent, constraint.child]
            self.constraints = [constraint]

        def merge(self, network):
            """
            Merge two networks if they have the same orientation and share elements.

            :arg network: Network to merge into this one

            :returns: True if the networks were merged, False otherwise
            """

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

    def merge_networks(self):
        """
        Iterate through networks merging where possible.
        """
        new_networks = []
        for network in self.networks:
            skip = False
            for new_network in new_networks:
                if new_network.merge(network):
                    skip = True
                    break
            if not skip:
                new_networks.append(network)
        self.networks = new_networks

    def add_constraint(self, constraint):
        """
        Add a constraint to the networks.

        :arg constraint: Equalize constraint to be added
        """
        self.networks.append(self._Network(constraint))
        self.merge_networks()

    def get_update_list(self):
        """
        Attempt solve of dimensions for each network and return a list of how
        each element should be resized to satisfy solution.
        """

        updates = []

        for network in self.networks:

            element_scales = {}
            constraints = [c for c in network.constraints]
            constraint = constraints.pop(0)
            element_scales[constraint.parent] = 1.
            element_scales[constraint.child] = constraint.value

            for _ in range(len(constraints)):
                constraint = constraints.pop(0)
                if constraint.parent in element_scales:
                    if constraint.child in element_scales:
                        raise Exception('Multiple dependencies for equalize size')
                    element_scales[constraint.child] = element_scales[constraint.parent] * constraint.value
                elif constraint.child in element_scales:
                    element_scales[constraint.parent] = element_scales[constraint.child] / constraint.value
                else:
                    constraints.append(constraint)
                if len(constraints) == 0:
                    break

            element_norm = sum([element_scales[key] for key in element_scales])
            element_actual = None

            if network.orientation == 'width':
                element_actual = sum([key.width for key in element_scales])
                for key in element_scales:
                    updates.append([key, 'n', element_scales[key] / element_norm * element_actual])
            elif network.orientation == 'height':
                element_actual = sum([key.height for key in element_scales])
                for key in element_scales:
                    updates.append([key, 'w', element_scales[key] / element_norm * element_actual])

        return updates
