// REPEAT binding for Knockout http://knockoutjs.com/
// (c) Michael Best
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
// Version 1.2.0

(function() {
if (!ko.bindingFlags) { ko.bindingFlags = {}; }

function findPropertyName(obj, equals) {
    for (var a in obj)
        if (obj.hasOwnProperty(a) && obj[a] === equals)
            return a;
}

var koProtoName = findPropertyName(ko.observable.fn, ko.observable);

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

        // extract and remove a data-repeat-bind attribute, if present
        if (!repeatBind) {
            repeatBind = element.getAttribute('data-repeat-bind');
            if (repeatBind)
                element.removeAttribute('data-repeat-bind');
        }

        // Make a copy of the element node to be copied for each repetition
        var cleanNode = element.cloneNode(true);
        if (typeof repeatBind == "string") {
            cleanNode.setAttribute('data-bind', repeatBind);
            repeatBind = null;
        }

        // Original element is no longer needed: delete it and create a placeholder comment
        var parent = element.parentNode, placeholder = document.createComment('ko_repeatplaceholder');
        parent.replaceChild(placeholder, element);

        // set up persistent data
        var lastRepeatCount = 0,
            notificationObservable = ko.observable(),
            repeatArray;

        var subscribable = ko.dependentObservable(function() {
            function makeArrayItemAccessor(index) {
                var f = function() {
                    var item = repeatArray[index];
                    if (!arguments.length) {
                        notificationObservable();   // for dependency tracking
                        return ko.utils.unwrapObservable(item);
                    } else if (ko.isObservable(item)) {
                        return item(arguments[0]);
                    }
                };
                // Pretend that our accessor function is an observable
                f[koProtoName] = ko.observable;
                return f;
            }

            function makeBinding(item, index, context) {
                return repeatArray
                    ? function() { return repeatBind.call(viewModel, item, index, context); }
                    : function() { return repeatBind.call(viewModel, index, context); }
            }

            var repeatCount = ko.utils.unwrapObservable(valueAccessor());
            if (typeof repeatCount == 'object') {
                if ('count' in repeatCount) {
                    repeatCount = ko.utils.unwrapObservable(repeatCount['count']);
                } else if ('foreach' in repeatCount) {
                    repeatArray = ko.utils.unwrapObservable(repeatCount['foreach']);
                } else if ('length' in repeatCount) {
                    repeatArray = repeatCount;
                }
                if (repeatArray)
                    repeatCount = repeatArray['length'] || 0;
            }
            // Remove nodes from end if array is shorter
            for (; lastRepeatCount > repeatCount; lastRepeatCount--) {
                ko.removeNode(placeholder.previousSibling);
            }

            // Notify existing nodes of change
            notificationObservable["notifySubscribers"]();

            // Add nodes to end if array is longer (also initially populates nodes)
            for (; lastRepeatCount < repeatCount; lastRepeatCount++) {
                // Clone node and add to document
                var newNode = cleanNode.cloneNode(true);
                parent.insertBefore(newNode, placeholder);
                newNode.setAttribute('data-repeat-index', lastRepeatCount);

                // Apply bindings to inserted node
                var newContext = ko.utils.extend(new bindingContext.constructor(), bindingContext);
                newContext[repeatIndex] = lastRepeatCount;
                if (repeatArray)
                    newContext[repeatData] = makeArrayItemAccessor(lastRepeatCount);
                if (repeatBind)
                    var shouldBindDescendants = ko.applyBindingsToNode(newNode, makeBinding(newContext[repeatData], lastRepeatCount, newContext), newContext).shouldBindDescendants;
                if (!repeatBind || shouldBindDescendants)
                    ko.applyBindings(newContext, newNode);
            }
        }, null, {'disposeWhenNodeIsRemoved': placeholder});

        return { 'controlsDescendantBindings': true, 'subscribable': subscribable };
    }
};
})();
