ko.bindingHandlers['repeat'] = {
    'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // initialize optional parameters
        var o = {repeatIndex:'$index', repeatData:'$item'};
        var repeatParam = ko.utils.unwrapObservable(valueAccessor());
        if (typeof repeatParam == 'object') {
            if ('index' in repeatParam) o.repeatIndex = repeatParam['index'];
            if ('item' in repeatParam) o.repeatData = repeatParam['item'];
            if ('bind' in repeatParam) o.repeatBind = repeatParam['bind'];
        }

        // Make a copy of the element node to be copied for each repetition
        o.cleanNode = element.cloneNode(true);
        // IE's cloneNode copies expando properties; remove them from the new node
        for (prop in o.cleanNode) {
            if (prop.substr(0, 4) == '__ko')
                delete o.cleanNode[prop];
        }
        // Remove node's binding (not necessary but cleaner)
        o.cleanNode.removeAttribute('data-bind');

        // Original element node is just a placeholder; make it hidden and delete children
        element.style.display = "none";
        element.disabled = true;
        while (element.firstChild)
            element.removeChild(element.firstChild);
        
        // set up persistent data         
        o.allRepeatNodes = [];
        o.repeatUpdate = ko.observable();
        o.repeatArray = undefined;
        bindingContext['$repeatOptions'] = o;
        
        return { 'controlsDescendantBindings': true };
    },
    'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var o = bindingContext['$repeatOptions'];
        var allRepeatNodes = o.allRepeatNodes;
        var parent = element.parentNode;
        
        var repeatCount = ko.utils.unwrapObservable(valueAccessor());
        if (typeof repeatCount == 'object') {
            if ('count' in repeatCount) {
                repeatCount = ko.utils.unwrapObservable(repeatCount['count']);
            } else if ('foreach' in repeatCount) {
                o.repeatArray = ko.utils.unwrapObservable(repeatCount['foreach']); 
                repeatCount = o.repeatArray['length'];
            }
        } 
        o.repeatUpdate["notifySubscribers"]();
            
        if (allRepeatNodes.length < repeatCount) {
            // Array is longer: add nodes to end (also initially populates nodes)
            var endNode = allRepeatNodes.length ? allRepeatNodes[allRepeatNodes.length-1] : element;
            var insertBefore = endNode.nextSibling;
            var startInsert = allRepeatNodes.length; 
            for (var i = startInsert; i < repeatCount; i++) {
                var newNode = o.cleanNode.cloneNode(true);     
                if (insertBefore)
                    parent.insertBefore(newNode, insertBefore);
                else
                    parent.appendChild(newNode);    
                newNode.setAttribute('data-repeat-index', i);
                allRepeatNodes[i] = newNode;
            }
            // Apply bindings to inserted nodes
            for (i = startInsert; i < repeatCount; i++) {
                var newContext = ko.utils.extend(new bindingContext.constructor(), bindingContext);
                delete newContext['$repeatOptions'];
                newContext[o.repeatIndex] = i;
                if (o.repeatArray) {
                    newContext[o.repeatData] = (function(index) { return function() {
                        o.repeatUpdate();   // for dependency tracking
                        return ko.utils.unwrapObservable(o.repeatArray[index]); 
                    }; })(i);
                }
                var shouldBindDescendants = true;
                if (o.repeatBind) {
                    var binding = ko.bindingProvider['instance']['parseBindingsString'](o.repeatBind, newContext);
                    shouldBindDescendants = ko.applyBindingsToNode(allRepeatNodes[i], binding, newContext).shouldBindDescendants;
                }
                if (shouldBindDescendants)
                    ko.applyBindingsToDescendants(newContext, allRepeatNodes[i]);
            }
        } else if (allRepeatNodes.length > repeatCount) {
            // Array is shorter: remove nodes from end
            while (allRepeatNodes.length > repeatCount) {
                ko.removeNode(allRepeatNodes.pop());
            }
        }
    }
};
