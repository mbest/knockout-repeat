if (!ko.bindingFlags) { ko.bindingFlags = {}; }

ko.bindingHandlers['repeat'] = {
    'flags': ko.bindingFlags.contentBind,
    'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // initialize optional parameters
        var repeatIndex = '$index', repeatData = '$item', repeatBind;
        var repeatParam = ko.utils.unwrapObservable(valueAccessor());
        if (typeof repeatParam == 'object') {
            if ('index' in repeatParam) repeatIndex = repeatParam['index'];
            if ('item' in repeatParam) repeatData = repeatParam['item'];
            if ('bind' in repeatParam) repeatBind = repeatParam['bind'];
        }

        // First clean the element node and remove node's binding
        ko.cleanNode(element);
        element.removeAttribute('data-bind');

        // Make a copy of the element node to be copied for each repetition
        var cleanNode = element.cloneNode(true);
        if (repeatBind)
            cleanNode.setAttribute('data-bind', repeatBind);

        // Original element is no longer needed: delete it and create a placeholder comment
        var parent = element.parentNode, placeholder = document.createComment('ko_repeatplaceholder');
        parent.replaceChild(placeholder, element);

        // set up persistent data
        var allRepeatNodes = [],
            repeatUpdate = ko.observable(),
            repeatArray = undefined;

        ko.dependentObservable(function() {
            var repeatCount = ko.utils.unwrapObservable(valueAccessor());
            if (typeof repeatCount == 'object') {
                if ('count' in repeatCount) {
                    repeatCount = ko.utils.unwrapObservable(repeatCount['count']);
                } else if ('foreach' in repeatCount) {
                    repeatArray = ko.utils.unwrapObservable(repeatCount['foreach']);
                    repeatCount = repeatArray && repeatArray['length'] || 0;
                }
            }
            // Remove nodes from end if array is shorter
            if (allRepeatNodes.length > repeatCount) {
                while (allRepeatNodes.length > repeatCount) {
                    ko.removeNode(allRepeatNodes.pop());
                }
            }
            // Notify existing nodes of change
            repeatUpdate["notifySubscribers"]();

            // Add nodes to end if array is longer (also initially populates nodes)
            if (allRepeatNodes.length < repeatCount) {
                var endNode = allRepeatNodes.length ? allRepeatNodes[allRepeatNodes.length-1] : placeholder;
                var insertBefore = endNode.nextSibling;
                var startInsert = allRepeatNodes.length;
                for (var i = startInsert; i < repeatCount; i++) {
                    var newNode = cleanNode.cloneNode(true);
                    parent.insertBefore(newNode, insertBefore);
                    newNode.setAttribute('data-repeat-index', i);
                    allRepeatNodes[i] = newNode;
                }
                // Apply bindings to inserted nodes
                for (i = startInsert; i < repeatCount; i++) {
                    var newContext = ko.utils.extend(new bindingContext.constructor(), bindingContext);
                    newContext[repeatIndex] = i;
                    if (repeatArray) {
                        newContext[repeatData] = (function(index) { return function() {
                            repeatUpdate();   // for dependency tracking
                            return ko.utils.unwrapObservable(repeatArray[index]);
                        }; })(i);
                    }
                    ko.applyBindings(newContext, allRepeatNodes[i]);
                }
            }
        }, null, {'disposeWhenNodeIsRemoved': placeholder});

        return { 'controlsDescendantBindings': true };
    }
};
