ko.bindingHandlers['repeat'] = {
    'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // initialize optional parameters
        var repeatIndex = '$index', repeatData = '$item', repeatBind;
        var repeatParam = ko.utils.unwrapObservable(valueAccessor());
        if (typeof repeatParam == 'object') {
            if ('index' in repeatParam) repeatIndex = repeatParam['index'];
            if ('item' in repeatParam) repeatData = repeatParam['item'];
            if ('bind' in repeatParam) repeatBind = repeatParam['bind'];
        }

        // Make a copy of the element node to be copied for each repetition
        var cleanNode = element.cloneNode(true);
        // IE's cloneNode copies expando properties; remove them from the new node
        for (prop in cleanNode) {
            if (prop.substr(0, 4) == '__ko')
                delete cleanNode[prop];
        }
        // Replace or remove node's binding
        if (repeatBind)
            cleanNode.setAttribute('data-bind', repeatBind);
        else
            cleanNode.removeAttribute('data-bind');

        // Original element node is just a placeholder; make it hidden and delete children
        element.style.display = "none";
        element.disabled = true;
        while (element.firstChild)
            element.removeChild(element.firstChild);
        
        // Use a dependent observable to manage (add/remove) sibling elements
        var allRepeatNodes = [];
        var parent = element.parentNode;
        ko.dependentObservable(function() {
            var repeatCount = ko.utils.unwrapObservable(valueAccessor());
            var repeatArray;
            if (typeof repeatCount == 'object') {
                if ('count' in repeatCount) {
                    repeatCount = ko.utils.unwrapObservable(repeatCount['count']);
                } else if ('foreach' in repeatCount) {
                    repeatArray = repeatCount['foreach']; 
                    repeatCount = ko.utils.unwrapObservable(repeatArray)['length'];
                }
            } 
                
            if (allRepeatNodes.length < repeatCount) {
                // Array is longer: add nodes to end (also initially populates nodes)
                var endNode = allRepeatNodes.length ? allRepeatNodes[allRepeatNodes.length-1] : element;
                var startInsert = allRepeatNodes.length; 
                for (var i = startInsert; i < repeatCount; i++) {
                    var newNode = cleanNode.cloneNode(true);     
                    if (endNode.nextSibling)
                        parent.insertBefore(newNode, endNode.nextSibling);
                    else
                        parent.appendChild(newNode);    
                    newNode.setAttribute('data-repeat-index', i);
                    allRepeatNodes[i] = newNode;
                    endNode = newNode;
                }
                // Apply bindings to inserted nodes
                for (i = startInsert; i < repeatCount; i++) {
                    var newContext = ko.utils.extend(new bindingContext.constructor(), bindingContext);
                    newContext[repeatIndex] = i;
                    if (repeatArray) {
                        newContext[repeatData] = (function(index) { return function() { 
                            return ko.utils.unwrapObservable(ko.utils.unwrapObservable(repeatArray)[index]); 
                        }; })(i);
                    }
                    ko.applyBindings(newContext, allRepeatNodes[i]);
                }
            } else if (allRepeatNodes.length > repeatCount) {
                // Array is shorter: remove nodes from end
                while (allRepeatNodes.length > repeatCount) {
                    ko.removeNode(allRepeatNodes.pop());
                }
            }
        }, null, {'disposeWhenNodeIsRemoved': element});
        
        return { 'controlsDescendantBindings': true };
    }
};
