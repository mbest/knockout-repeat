// REPEAT binding for Knockout http://knockoutjs.com/
// (c) Michael Best
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
// Version 1.4.2

(function(factory) {
    if (typeof define === 'function' && define['amd']) {
        // [1] AMD anonymous module
        define(['knockout'], factory);
    } else {
        // [2] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko']);
    }
})(function(ko) {

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

        // Read and set fixed options--these options cannot be changed
        var repeatParam = ko.utils.unwrapObservable(valueAccessor());
        if (repeatParam && typeof repeatParam == 'object' && !('length' in repeatParam)) {
            var repeatIndex = repeatParam['index'],
                repeatData = repeatParam['item'],
                repeatStep = repeatParam['step'],
                repeatReversed = repeatParam['reverse'],
                repeatBind = repeatParam['bind'],
                repeatInit = repeatParam['init'],
                repeatUpdate = repeatParam['update'];
        }
        // Set default values for options that need it
        repeatIndex = repeatIndex || '$index';
        repeatData = repeatData || ko.bindingHandlers['repeat']['itemName'] || '$item';
        repeatStep = repeatStep || 1;
        repeatReversed = repeatReversed || false;

        // First clean the element node and remove node's binding
        ko.cleanNode(element);
        element.removeAttribute('data-bind');

        // extract and remove a data-repeat-bind attribute, if present
        if (!repeatBind) {
            repeatBind = element.getAttribute('data-repeat-bind');
            if (repeatBind) {
                element.removeAttribute('data-repeat-bind');
            }
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

        // Set up persistent data
        var lastRepeatCount = 0,
            notificationObservable = ko.observable(),
            repeatArray;

        if (repeatInit) {
            repeatInit(parent);
        }

        var subscribable = ko.dependentObservable(function() {
            function makeArrayItemAccessor(index) {
                var f = function(newValue) {
                    var item = repeatArray[index];
                    if (!arguments.length) {
                        notificationObservable();   // for dependency tracking
                        return ko.utils.unwrapObservable(item);
                    } else if (ko.isObservable(item)) {
                        return item(newValue);
                    } else {
                        repeatArray[index] = newValue;
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

            // Read and set up variable options--these options can change and will update the binding
            var repeatParam = ko.utils.unwrapObservable(valueAccessor()), repeatCount = 0;
            if (repeatParam && typeof repeatParam == 'object') {
                if ('length' in repeatParam) {
                    repeatArray = repeatParam;
                    repeatCount = repeatArray['length'];
                } else {
                    if ('foreach' in repeatParam) {
                        repeatArray = ko.utils.unwrapObservable(repeatParam['foreach']);
                        repeatCount = repeatArray && repeatArray['length'] || 0;
                    }
                    // If a count value is provided (>0), always output that number of items
                    if ('count' in repeatParam)
                        repeatCount = ko.utils.unwrapObservable(repeatParam['count']) || repeatCount;
                    // If a limit is provided, don't output more than the limit
                    if ('limit' in repeatParam)
                        repeatCount = Math.min(repeatCount, ko.utils.unwrapObservable(repeatParam['limit'])) || repeatCount;
                }
            } else {
                repeatCount = repeatParam || 0;
            }

            // Remove nodes from end if array is shorter
            for (; lastRepeatCount > repeatCount; lastRepeatCount-=repeatStep) {
                ko.removeNode(repeatReversed ? placeholder.nextSibling : placeholder.previousSibling);
            }

            // Notify existing nodes of change
            notificationObservable["notifySubscribers"]();

            // Add nodes to end if array is longer (also initially populates nodes)
            for (; lastRepeatCount < repeatCount; lastRepeatCount+=repeatStep) {
                // Clone node and add to document
                var newNode = cleanNode.cloneNode(true);
                parent.insertBefore(newNode, repeatReversed ? placeholder.nextSibling : placeholder);
                newNode.setAttribute('data-repeat-index', lastRepeatCount);

                // Apply bindings to inserted node
                if (repeatArray && repeatData == '$data') {
                    var newContext = bindingContext.createChildContext(makeArrayItemAccessor(lastRepeatCount));
                } else {
                    var newContext = bindingContext.extend
                        ? bindingContext.extend()
                        : ko.utils.extend(new bindingContext.constructor(), bindingContext);
                    if (repeatArray)
                        newContext[repeatData] = makeArrayItemAccessor(lastRepeatCount);
                }
                newContext[repeatIndex] = lastRepeatCount;
                if (repeatBind) {
                    var result = ko.applyBindingsToNode(newNode, makeBinding(newContext[repeatData], lastRepeatCount, newContext), newContext, true),
                        shouldBindDescendants = result && result.shouldBindDescendants;
                }
                if (!repeatBind || (result && shouldBindDescendants !== false)) {
                    ko.applyBindings(newContext, newNode);
                }
            }
            if (repeatUpdate) {
                repeatUpdate(parent);
            }
        }, null, {'disposeWhenNodeIsRemoved': placeholder});

        return { 'controlsDescendantBindings': true, 'subscribable': subscribable };
    }
};
});
