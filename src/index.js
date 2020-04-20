module.exports = function (layoutData, opts) {
  opts.rule = 'android';

  let optionSettingData = parseOptionSetting(opts);

  if (!nativeMode) {
    parseBindingData(layoutData);
    resolveDataMapping(layoutData);
  }

  let resultData = generateTargetDSL(layoutData, optionSettingData);

  if (optionSettingData['doTrace']) {
    // console.log(
    //   'efficiencyValue: ' + resultData['xmlResult']['efficiencyValue']
    // );
    traceViewXUseLog(
      opts.http,
      opts.querystring,
      resultData['xmlResult']['efficiencyValue']
    );
  }

  return {
    renderData: {
      xml: resultData['xmlResult']['xml'],
      mock: resultData['mock'],
      origin: resultData['origin'],
    },
    panelDisplay: [
      {
        panelName: 'android_demo.xml',
        panelValue: resultData['xmlResult']['xml'],
        panelType: 'BuilderRaxStyle',
      },
    ],
    xml: resultData['origin'],
    style: resultData['layout'],
    prettierOpt: {
      printWidth: 120,
      singleQuote: false,
    },
    noTemplate: true,
  };
};

function parseOptionSetting(opts) {
  let settingData = {};

  let originData = opts.originData;
  semanticData = opts.semanticData;

  fromImgcook = false;
  ignoreDataMock = false;
  nativeMode = false;
  findoutPriceModel = opts.price;

  if (!opts.rule) {
    fromImgcook = true;
    targetDSLType = RULE_TYPE.RULE_2;
    adapterSchemaProtocol(originData);
  } else {
    targetDSLType = opts.rule;
    if (targetDSLType == RULE_TYPE.RULE_N) {
      nativeMode = true;
      adapterSchemaProtocol(originData);
    }
  }

  if (!opts.scale) {
    SCALE_FACTOR = 2.0;
  } else {
    if (opts.scale == SCALE_TYPE.SCALE_1) {
      SCALE_FACTOR = 1.0;
    } else {
      SCALE_FACTOR = 2.0;
    }
  }

  let doTrace = false;
  if (opts.http && opts.querystring) {
    doTrace = true;
  }

  settingData['originData'] = originData;
  settingData['doTrace'] = doTrace;
  return settingData;
}

function generateTargetDSL(layoutData, optionSettingData) {
  let resultData = {};

  // mock data
  mockData = {};
  mockTxtDataIndex = 0;
  mockImgDataIndex = 0;
  mockData.data = {};
  mockData.actions = [];

  resultData['xmlResult'] = resolveOriginData(optionSettingData['originData']);

  mockData = [mockData];

  resultData['mock'] = `${JSON.stringify(mockData, null, 2)}`;
  // console.log('mock:\n ' + resultData['mock']);
  resultData['origin'] = `${JSON.stringify(
    optionSettingData['originData'],
    null,
    2
  )}`;
  layoutData.doTrace = optionSettingData['doTrace'];
  resultData['layout'] = `${JSON.stringify(layoutData, null, 2)}`;

  return resultData;
}

/******************************************************
                      常量定义
 ******************************************************/

// const ISSUE_LINK =
//   '<!--  -->\n';

const XML_HEADER = `<?xml version="1.0" encoding="utf-8"?>\n`;
const DINAMIC_NAMESPACE =
  'xmlns:dinamic="http://schemas.android.com/apk/res-auto"';
const ANDROID_NAMESPACE =
  'xmlns:android="http://schemas.android.com/apk/res/android"';
const LINE_INDENT = '    ';

/** 缩放比例， 一般基于750， 手淘部分基于375 */
var SCALE_FACTOR;

const DELTA_SIZE_3 = 3;
const DELTA_SIZE_5 = 5;

/** key = jsonId, value = child */
var originDataIdMap;
/** key = jsonId, value = child with new style */
var layoutDataIdMap;
/** key = originId, value = jsonId */
var layoutDataOIdMap;
/** key = jsonId, value = dataToBind */
var bindingDataIdMap;

var mockData;
var mockTxtDataIndex = 0;
var mockImgDataIndex = 0;

var targetDSLType;
var fromImgcook;
var findoutPriceModel;
var ignoreDataMock;

var nativeMode;

var semanticData;

const RULE_TYPE = {
  RULE_2: '2.0',
  RULE_3: '3.0',
  RULE_N: 'android',
};
const SCALE_TYPE = {
  SCALE_1: '1.0',
  SCALE_2: '2.0',
};

const VIEW_TYPE = {
  VIEW: 'DView',
  TEXT_VIEW: 'DTextView',
  IMAGE_VIEW: 'HImageView',
  GROUP: 'ViewGroup',
};

const ORIENTATION_TYPE = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  ABSOLUTE: 'absolute',
};

const LAYOUT_TYPE = {
  LINEARLAYOUT: 'DLinearLayout',
  FRAMELAYOUT: 'DFrameLayout',
};

/********************************************************************
                      处理 originData 与 layoutData 数据映射
 ********************************************************************/

function parseBindingData(layoutData) {
  bindingDataIdMap = HashMap.create();
  layoutDataIdMap = HashMap.create();
  layoutDataOIdMap = HashMap.create();
  let bindingData = layoutData.dataBindingStore;
  if (bindingData) {
    bindingData.forEach(function (child) {
      if (child.belongId != 'id_') {
        if (isValidValue(child.value)) {
          var obj = new Object();
          obj.id = child.belongId;
          obj.target = child.target[0];
          obj.static = child.value.isStatic;
          obj.bindValue = undefined;
          if (child.value) {
            if (child.value.isStatic == true) {
              if (isValidValue(child.value.value)) {
                obj.bindValue = child.value.value;
              }
              if (isValidValue(child.defaultValue)) {
                obj.handEdit = child.defaultValue != obj.bindValue;
              }
            } else {
              obj.handEdit = child.value.isHandEdit;
              if (isValidValue(child.value.sourceValue)) {
                obj.bindValue = child.value.sourceValue;
              }
            }
          }
          if (isDefined(obj.bindValue)) {
            var bindArray = bindingDataIdMap.get(obj.id);
            if (!isValidValue(bindArray)) {
              bindArray = new Array();
              bindingDataIdMap.put(obj.id, bindArray);
            }
            bindArray.push(obj);
          }
        }
      }
    });
    // console.log('bindingDataIdMap: ' + JSON.stringify(bindingDataIdMap, null, 2));
  }
}

function resolveDataMapping(layoutData) {
  parseViewGroup(layoutData);
  // console.log('layoutDataOIdMap: ' + JSON.stringify(layoutDataOIdMap, null, 2));
}

function parseViewGroup(groupData) {
  parseSingleView(groupData);
  groupData.children.forEach(function (child) {
    if (child.children && child.children.length > 0) {
      parseViewGroup(child);
    } else {
      parseSingleView(child);
    }
  });
}

function parseSingleView(data) {
  if (isValidValue(data.originId)) {
    var obj = new Object();
    obj.id = data.id;
    obj.style = data.style;
    obj.originId = data.originId;
    layoutDataIdMap.put(obj.id, obj);
    layoutDataOIdMap.put(obj.originId, obj.id);
  } else if (isValidValue(data._jsonId)) {
    var obj = new Object();
    obj.id = data.id;
    obj.style = data.style;
    obj.originId = data._jsonId;
    layoutDataIdMap.put(obj.id, obj);
    layoutDataOIdMap.put(obj.originId, obj.id);
  }
}

function findDataBinding(widget) {
  if (ignoreDataMock || nativeMode) return;

  var jsonId = layoutDataOIdMap.get(widget.id);
  if (jsonId) {
    // console.log('jsonId: ' + JSON.stringify(jsonId, null, 2));
    var dataToBindArray = bindingDataIdMap.get(jsonId);
    if (dataToBindArray) {
      // console.log('dataToBindArray: ' + JSON.stringify(dataToBindArray, null, 2));
      for (var index = 0; index < dataToBindArray.length; index++) {
        var dataToBind = dataToBindArray[index];
        if (dataToBind) {
          // console.log('dataToBind: ' + JSON.stringify(dataToBind, null, 2));
          var mhandEdit = isDefined(dataToBind.handEdit) && dataToBind.handEdit;
          switch (dataToBind.target) {
            case 'innerText':
              if (widget.viewType == VIEW_TYPE.TEXT_VIEW) {
                if (
                  dataToBind.bindValue.indexOf('@') == 0 ||
                  (dataToBind.static && mhandEdit)
                ) {
                  widget.text = dataToBind.bindValue;

                  if (dataToBind.static && mhandEdit) {
                    widget.defaultValue = `<!--  text=${widget.text} -->`;
                  }

                  let key = resolveSemanticDataKey(widget.id);
                  if (!isDefined(key)) {
                    key = 'text' + mockTxtDataIndex++;
                  }
                  mockData.data[key] = widget.text;
                  widget.mocked = true;
                } else if (mhandEdit) {
                  let dataKey = `${dataToBind.bindValue}`;
                  mockData.data[dataKey] = widget.text;
                  widget.mocked = true;

                  widget.text = `@data{data.${dataToBind.bindValue}}`;
                }
              }
              break;
            case 'source':
              if (widget.viewType == VIEW_TYPE.IMAGE_VIEW) {
                if (
                  dataToBind.bindValue.indexOf('@') == 0 ||
                  (dataToBind.static && mhandEdit)
                ) {
                  widget.src = dataToBind.bindValue;

                  if (dataToBind.static && mhandEdit) {
                    widget.defaultValue = `<!--  url=${widget.src} -->`;
                  }

                  let key = resolveSemanticDataKey(widget.id);
                  if (!isDefined(key)) {
                    key = 'imageurl' + mockImgDataIndex++;
                  }
                  mockData.data[key] = widget.src;
                  widget.mocked = true;
                } else if (mhandEdit) {
                  let dataKey = `${dataToBind.bindValue}`;
                  mockData.data[dataKey] = widget.src;
                  widget.mocked = true;

                  widget.src = `@data{data.${dataKey}}`;
                }
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }
}

function resolveMockData(widget) {
  if (ignoreDataMock || nativeMode) return;
  console.log(
    'resolveSemanticDataKey: ' +
      JSON.stringify(resolveSemanticDataKey(widget.id), null, 2)
  );
  if (widget.viewType == VIEW_TYPE.TEXT_VIEW) {
    if (isDefined(widget.priceModel)) {
      let key = 'price';
      mockData.data[key] = widget.priceModel;
      widget.text = `@data{data.${key}}`;
    } else {
      let key = resolveSemanticDataKey(widget.id);
      if (!isDefined(key)) {
        key = 'text' + mockTxtDataIndex++;
      }
      mockData.data[key] = widget.text;
      widget.text = `@data{data.${key}}`;
    }
  } else if (widget.viewType == VIEW_TYPE.IMAGE_VIEW) {
    let key = resolveSemanticDataKey(widget.id);
    if (!isDefined(key)) {
      key = 'imageurl' + mockImgDataIndex++;
    }
    mockData.data[key] = widget.src;
    widget.src = `@data{data.${key}}`;
  }
}

function resolveSemanticDataKey(widgetId) {
  if (widgetId && semanticData && semanticData.length > 0) {
    for (var index = 0; index < semanticData.length; index++) {
      let data = semanticData[index];
      if (equalsIgnoreCase(data.id, widgetId)) {
        return data.name;
      }
    }
  }
  return undefined;
}

/******************************************************
                      处理图层数据
 ******************************************************/

/** 处理 imgcook 提供的Sketch图层源数据 并输出DSL*/
function resolveOriginData(originData) {
  if (typeof originData == 'object') {
    let rootType = originData.type;
    let children = originData.children;
    if (rootType == 'Block') {
      var rootViewGroup = ViewGroup.create(originData.props);
      rootViewGroup.id = 'root_group';
      originDataIdMap = HashMap.create();
      resolveChildrenData(rootViewGroup, children);
      findSpecialTextStyle(rootViewGroup);
      splitVerticalArea(rootViewGroup);
      findOverlap(rootViewGroup);
      findInnerChild(rootViewGroup);
      findLinear(rootViewGroup, ORIENTATION_TYPE.HORIZONTAL);
      judgeViewTree(rootViewGroup, judgeGroupOrientation);
      cutDuplicateLayer(rootViewGroup);
      removeHiddenGroup(rootViewGroup);
      judgeViewTree(rootViewGroup, judgeGroupOrientation);
      var xmlResult = new Object();
      xmlResult.efficiencyValue = checkEfficiencyCalculation(rootViewGroup);
      xmlResult.xml = rootViewGroup.exportDSL();
      if (targetDSLType == RULE_TYPE.RULE_2 && fromImgcook) {
        targetDSLType = RULE_TYPE.RULE_3;
        ignoreDataMock = true;
        xmlResult.extraXml = rootViewGroup.exportDSL();
      } else {
        xmlResult.extraXml = '';
      }
      return xmlResult;
    }
  }
}

/** 处理图层子节点集合 */
function resolveChildrenData(viewGroup, childrenData) {
  if (childrenData && childrenData.length > 0) {
    // 遍历子节点
    childrenData.forEach(function (child) {
      resolveChildData(viewGroup, child);
    });
  }
}

/** 处理子节点 与控件或容器映射 */
function resolveChildData(viewGroup, childData) {
  if (childData && typeof childData == 'object') {
    let childType = childData.type;
    var propsData = childData.props;
    var viewType = VIEW_TYPE.VIEW;

    if (
      equalsIgnoreCase(childType, 'div') ||
      equalsIgnoreCase(childType, 'repeat')
    ) {
      let children = childData.children;
      if (children && typeof children == 'object' && children.length > 0) {
        var childViewGroup = ViewGroup.create(propsData);
        childViewGroup.depth = viewGroup.depth + 1;
        viewGroup.children.push(childViewGroup);
        resolveChildrenData(childViewGroup, children);
        return;
      }
      if (propsData && typeof propsData == 'object') {
        if (propsData.children && typeof propsData.children == 'string') {
          viewType = VIEW_TYPE.TEXT_VIEW;
        }
      }
    } else if (equalsIgnoreCase(childType, 'image')) {
      viewType = VIEW_TYPE.IMAGE_VIEW;
    } else if (equalsIgnoreCase(childType, 'text')) {
      viewType = VIEW_TYPE.TEXT_VIEW;
    }

    if (propsData && typeof propsData == 'object') {
      var childView = null;
      switch (viewType) {
        case VIEW_TYPE.VIEW:
          childView = View.create(propsData);
          if (childData.mask && !childData.backgroundColor) {
            childView.backgroundColor = '#ffffff';
          }
          break;
        case VIEW_TYPE.TEXT_VIEW:
          childView = TextView.create(propsData);
          break;
        case VIEW_TYPE.IMAGE_VIEW:
          childView = ImageView.create(propsData);
          break;
        default:
          break;
      }
      if (viewType == VIEW_TYPE.VIEW && childView.overflow == 'hidden') {
        return;
      }
      if (childView && childView.left < viewGroup.left + viewGroup.width) {
        childView.id = childData.id;
        if (!childToParentBackground(childView, viewGroup)) {
          childView.depth = viewGroup.depth + 1;
          viewGroup.children.push(childView);
          originDataIdMap.put(childView.id, childView);
        }
      }
    }
  }
}

/******************************************************
                      布局策略
 ******************************************************/

function splitVerticalArea(parent) {
  if (parent) {
    let children = parent.children;
    if (children && children.length > 1) {
      let length = children.length;
      var splitTopIndexArray = new Array();
      let recordSpaceStatus = true;
      for (var top = parent.top; top <= parent.top + parent.height; top++) {
        let isSpace = true;
        for (var index = 0; index < length; index++) {
          let child = children[index];
          if (isContainRect(top, child) && child.width != parent.width) {
            isSpace = false;
            // console.log('splitVerticalArea xxxxxx: ' + top);
            break;
          }
        }
        if (recordSpaceStatus != isSpace || top == parent.top + parent.height) {
          recordSpaceStatus = isSpace;
          if (splitTopIndexArray.length > 0) {
            splitTopIndexArray.push([
              splitTopIndexArray[splitTopIndexArray.length - 1][1],
              top,
            ]);
          } else {
            if (top != 0) {
              splitTopIndexArray.push([0, top]);
            }
          }
        }
      }

      if (splitTopIndexArray.length > 0) {
        // console.log(
        //   'splitVerticalArea splitTopIndexArray: ' +
        //     JSON.stringify(splitTopIndexArray)
        // );
        for (var i = 0; i < splitTopIndexArray.length; i++) {
          var tempArray = new Array();
          var tempChildrenArray = new Array();
          for (var index = 0; index < parent.children.length; index++) {
            let child = parent.children[index];
            if (
              child.top >= splitTopIndexArray[i][0] &&
              child.top + child.height <= splitTopIndexArray[i][1] &&
              !(child.width == parent.width && child.height == 1)
            ) {
              tempArray.push(child);
            } else {
              tempChildrenArray.push(child);
            }
          }
          if (tempArray.length > 1) {
            // console.log('splitVerticalArea ddddddd: ' + JSON.stringify(tempArray, null, 2));
            var group = ViewGroup.createFromArray(tempArray);
            splitHorizontalArea(group);
            tempChildrenArray.push(group);
            parent.children = tempChildrenArray;
          }
        }
        // console.log('splitVerticalArea new children: ' + JSON.stringify(parent.children, null, 2));
      }
    }
  }
}

function splitHorizontalArea(parent) {
  if (parent) {
    let children = parent.children;
    if (children && children.length > 1) {
      let length = children.length;
      var splitLeftIndexArray = new Array();
      let recordSpaceStatus = true;
      for (var left = parent.left; left <= parent.left + parent.width; left++) {
        let isSpace = true;
        for (var index = 0; index < length; index++) {
          let child = children[index];
          if (
            isContainRect(left, child, 'horizontal') &&
            child.height != parent.height
          ) {
            isSpace = false;
            // console.log('splitHorizontalArea xxxxxx: ' + top);
            break;
          }
        }
        if (
          recordSpaceStatus != isSpace ||
          left == parent.left + parent.width
        ) {
          recordSpaceStatus = isSpace;
          if (splitLeftIndexArray.length > 0) {
            splitLeftIndexArray.push([
              splitLeftIndexArray[splitLeftIndexArray.length - 1][1],
              left,
            ]);
          } else {
            if (left != parent.left) {
              splitLeftIndexArray.push([parent.left, left]);
            }
          }
        }
      }

      if (splitLeftIndexArray.length > 0) {
        // console.log(
        //   'splitHorizontalArea splitleftIndexArray: ' +
        //     JSON.stringify(splitLeftIndexArray)
        // );
        for (var i = 0; i < splitLeftIndexArray.length; i++) {
          var tempArray = new Array();
          var tempChildrenArray = new Array();
          for (var index = 0; index < parent.children.length; index++) {
            let child = parent.children[index];
            if (
              child.left >= splitLeftIndexArray[i][0] &&
              child.left + child.width <= splitLeftIndexArray[i][1] &&
              !(child.height == parent.height && child.width == 1)
            ) {
              tempArray.push(child);
            } else {
              tempChildrenArray.push(child);
            }
          }
          if (tempArray.length > 1) {
            var group = ViewGroup.createFromArray(tempArray);
            findLinear(group, ORIENTATION_TYPE.HORIZONTAL);
            tempChildrenArray.push(group);
            parent.children = tempChildrenArray;
          }
        }
      }
    }
  }
}

function isContainRect(target, child, type) {
  if (type == 'horizontal') {
    return target >= child.left && target <= child.left + child.width;
  } else {
    return target >= child.top && target <= child.top + child.height;
  }
}

/** 根据控件位置关系，查找出相交的元素，进行收集归拢 */
function findOverlap(parent) {
  if (parent) {
    let children = parent.children;
    if (children && children.length > 1) {
      let length = children.length;
      let tempPositionArray = new Array();
      let tempNewChildrenArray = new Array();
      let childrenChanged = false;

      for (var index = 0; index < length; index++) {
        if (isContainPosition(index, tempPositionArray)) {
          continue;
        }

        var child1 = children[index];

        var tempArray = new Array();
        tempArray.push(child1);

        if (isTypeGroup(child1) && !child1.overlapChekced) {
          child1.overlapChekced = true;
          findOverlap(child1);
        }
        if (!isSameArea(child1, parent)) {
          for (var position = index + 1; position < length; position++) {
            if (isContainPosition(position, tempPositionArray)) {
              continue;
            }
            var child2 = children[position];

            if (isTypeGroup(child2) && !child2.overlapChekced) {
              child2.overlapChekced = true;
              findOverlap(child2);
            }

            for (var tIndex = 0; tIndex < tempArray.length; tIndex++) {
              if (isOverlapRelationship(tempArray[tIndex], child2)) {
                tempArray.push(child2);
                tempPositionArray.push(position);
                break;
              }
            }
          }
        }
        if (tempArray.length > 1 && tempArray.length < length) {
          // console.log('tempArray findOverlap: ' + JSON.stringify(tempArray, null, 2));
          var group = ViewGroup.createFromArray(tempArray);
          tempNewChildrenArray.push(group);
          childrenChanged = true;
          findOverlap(group);
        } else {
          tempNewChildrenArray.push(child1);
        }
      }

      if (childrenChanged) {
        parent.children = tempNewChildrenArray;
      }

      findSpecialTextStyle(parent);
    }
  }
}

function findInnerChild(parent) {
  if (parent) {
    let children = parent.children;
    if (children) {
      let length = children.length;
      let tempPositionArray = new Array();
      let tempNewChildrenArray = new Array();
      let childrenChanged = false;
      for (var index = 0; index < length; index++) {
        if (isContainPosition(index, tempPositionArray)) {
          continue;
        }

        var child1 = children[index];

        var tempArray = new Array();
        tempArray.push(child1);
        if (isTypeGroup(child1) && !child1.innerChildChecked) {
          child1.innerChildChecked = true;
          findInnerChild(child1);
        }
        if (child1.viewType == VIEW_TYPE.VIEW && !isSameArea(child1, parent)) {
          for (var position = index + 1; position < length; position++) {
            if (isContainPosition(position, tempPositionArray)) {
              continue;
            }
            var child2 = children[position];

            if (isTypeGroup(child2) && !child2.innerChildChecked) {
              child2.innerChildChecked = true;
              findInnerChild(child2);
            }

            if (isInnerChild(child1, child2) || isSameArea(child1, child2)) {
              tempArray.push(child2);
              tempPositionArray.push(position);
              break;
            }
          }
        }
        if (tempArray.length > 1 && tempArray.length < length) {
          let tempLength = tempArray.length;
          // console.log('tempArray innerchild: ' + JSON.stringify(tempArray, null, 2));
          var group = ViewGroup.createFromArray(tempArray);
          tempNewChildrenArray.push(group);
          childrenChanged = true;
        } else {
          tempNewChildrenArray.push(child1);
        }
      }

      if (childrenChanged) {
        parent.children = tempNewChildrenArray;
      }
    }
  }
}

/** 根据控件位置关系，找出线性关系的元素进行归拢 */
function findLinear(parent, orientation) {
  if (parent) {
    let children = parent.children;
    if (children && children.length > 1) {
      let length = children.length;
      let tempPositionArray = new Array();
      let tempNewChildrenArray = new Array();
      let childrenChanged = false;

      for (var index = 0; index < length; index++) {
        if (isContainPosition(index, tempPositionArray)) {
          continue;
        }

        var child1 = children[index];

        var tempArray = new Array();
        tempArray.push(child1);

        if (
          isTypeGroup(child1) &&
          !(
            isDefined(child1.linearCheckedDirection) &&
            child1.linearCheckedDirection == orientation
          )
        ) {
          child1.linearCheckedDirection = orientation;
          findLinear(child1, orientation);
        }

        for (var position = index + 1; position < length; position++) {
          if (isContainPosition(position, tempPositionArray)) {
            continue;
          }
          var child2 = children[position];
          if (
            isTypeGroup(child2) &&
            !(
              isDefined(child2.linearCheckedDirection) &&
              child2.linearCheckedDirection == orientation
            )
          ) {
            child2.linearCheckedDirection = orientation;
            findLinear(child2, orientation);
          }

          for (var tIndex = 0; tIndex < tempArray.length; tIndex++) {
            let result = undefined;
            if (orientation === ORIENTATION_TYPE.HORIZONTAL) {
              result = isHorizontalRelationship(
                tempArray[tIndex],
                child2,
                parent
              );
            } else if (orientation === ORIENTATION_TYPE.VERTICAL) {
              result = isVerticalRelationship(child1, child2, parent);
            }
            if (isDefined(result)) {
              tempArray.push(child2);
              tempPositionArray.push(position);
              break;
            }
          }
        }

        if (tempArray.length > 1 && tempArray.length < length) {
          // console.log('tempArray findLear: ' + orientation + "\n" + JSON.stringify(tempArray, null, 2));
          var group = ViewGroup.createFromArray(tempArray);
          tempNewChildrenArray.push(group);
          childrenChanged = true;
        } else {
          tempNewChildrenArray.push(child1);
          if (orientation == ORIENTATION_TYPE.VERTICAL) {
            // console.log(tempArray.length > 1 ? "ignore findLear "+ orientation  : "none findLear " + orientation);
          }
        }
      }

      if (childrenChanged) {
        parent.children = tempNewChildrenArray;
        // console.log('parent new findLear: ' + orientation + "\n" + JSON.stringify(parent.children , null, 2));
      }
    }
  }
}

function canUnpackLayer(cgroup, pgroup) {
  let can = false;
  let cannotChange =
    isDefined(cgroup.backgroundColor) &&
    isDefined(pgroup.backgroundColor) &&
    cgroup.backgroundColor != pgroup.backgroundColor;
  let isSameViewType =
    cgroup.viewType == pgroup.viewType &&
    cgroup.viewType == VIEW_TYPE.LINEARLAYOUT &&
    cgroup.orientation == pgroup.orientation;
  let isInnerTextChild =
    cgroup.backgroundColor &&
    cgroup.children &&
    cgroup.children[0].viewType == VIEW_TYPE.TEXT_VIEW;
  let singleChild =
    cgroup.children &&
    cgroup.children.length == 1 &&
    isSameArea(cgroup, cgroup.children[0]) &&
    cgroup.children[0].viewType != VIEW_TYPE.IMAGE_VIEW;
  can = (isSameViewType && !cannotChange && !isInnerTextChild) || singleChild;
  if (can && !singleChild) {
    copyChildAttrToParent(cgroup, pgroup);
  }
  return can;
}

/** check所有group的层级，去除冗余的图层 */
function cutDuplicateLayer(parent) {
  if (parent) {
    let children = parent.children;
    if (children && children.length > 1) {
      let length = children.length;
      var needUnpackArray = new Array();
      for (var index = 0; index < length; index++) {
        let child = children[index];
        if (isTypeGroup(child)) {
          if (canUnpackLayer(child, parent)) {
            needUnpackArray.push(child.id);
            break;
          } else {
            if (child.top == parent.top && child.width == parent.width) {
              if (isDefined(child.cornerRadiusLeftTop)) {
                parent.cornerRadiusLeftTop = child.cornerRadiusLeftTop;
                child.cornerRadiusLeftTop = undefined;
              }
              if (isDefined(child.cornerRadiusRightTop)) {
                parent.cornerRadiusRightTop = child.cornerRadiusRightTop;
                child.cornerRadiusRightTop = undefined;
              }
              if (isDefined(child.cornerRadiusLeftBottom)) {
                parent.cornerRadiusLeftBottom = child.cornerRadiusLeftBottom;
                child.cornerRadiusLeftBottom = undefined;
              }
              if (isDefined(child.cornerRadiusRightBottom)) {
                parent.cornerRadiusRightBottom = child.cornerRadiusRightBottom;
                child.cornerRadiusRightBottom = undefined;
              }
              if (
                isDefined(child.backgroundColor) &&
                isDefined(parent.backgroundColor) &&
                child.backgroundColor == parent.backgroundColor
              ) {
                child.backgroundColor = undefined;
              }
            }
          }
        }
      }

      if (needUnpackArray.length > 0) {
        // console.log('cutDuplicatLayer needUnpackArray: ' + JSON.stringify(needUnpackArray));
        var tempChildrenArray = new Array();
        for (var index = 0; index < length; index++) {
          let child = children[index];
          for (var i = 0; i < needUnpackArray.length; i++) {
            if (child.id == needUnpackArray[i]) {
              resetChildDepth(child.children, -1);
              child.children.forEach(function (c) {
                tempChildrenArray.push(c);
              });
            } else {
              tempChildrenArray.push(child);
            }
          }
        }
        parent.children = tempChildrenArray;
        cutDuplicateLayer(parent);
      }
    }
  }
}

function removeHiddenGroup(parent) {
  if (parent) {
    let children = parent.children;
    if (children && children.length > 1) {
      let length = children.length;
      let tempNewChildrenArray = new Array();
      for (var index = 0; index < length; index++) {
        let child = children[index];
        if (!(isTypeGroup(child) && child.overflow == 'hidden')) {
          if (isTypeGroup(child)) {
            removeHiddenGroup(child);
          }
          tempNewChildrenArray.push(child);
        }
      }
      if (
        tempNewChildrenArray.length > 1 &&
        tempNewChildrenArray.length != length
      ) {
        parent.children = tempNewChildrenArray;
      }
    }
  }
}

/** 找出划线Text, 价格组件 */
function findSpecialTextStyle(parent) {
  if (parent) {
    if (parent.children && parent.children.length > 1) {
      for (var i = 0; i < parent.children.length; i++) {
        if (isTypeGroup(parent.children[i])) {
          let obj = isStrikeThroughStyle(parent.children[i]);
          if (obj) {
            parent.children[i] = obj;
            // console.log('strike: ' + JSON.stringify(parent.children[i], null, 2));
          } else {
            obj = isPriceTextWidget(parent.children[i]);
            if (obj) {
              parent.children[i] = obj;
              // console.log('price text: ' + JSON.stringify(parent.children[i], null, 2));
            } else {
              findSpecialTextStyle(parent.children[i]);
            }
          }
        }
      }
    }
  }
}

function findBackgroundMask(parent) {
  if (parent) {
    if (parent.children && parent.children.length > 1) {
      let maskChildrenArray = new Array();
      let nonMaskChildrenArray = new Array();
      let tempNewChildrenArray = new Array();
      for (var i = 0; i < parent.children.length; i++) {
        let child = parent.children[i];
        if (isSameArea(child, parent) && !isTypeGroup(child)) {
          maskChildrenArray.push(child);
        } else {
          nonMaskChildrenArray.push(child);
        }
      }
      if (maskChildrenArray.length >= 1) {
        // console.log(
        //   'maskChildrenArray: ' + JSON.stringify(maskChildrenArray, null, 2)
        // );
        if (maskChildrenArray.length > 1) {
          var group = ViewGroup.createFromArray(maskChildrenArray);
          tempNewChildrenArray.push(group);
        } else {
          tempNewChildrenArray.push(maskChildrenArray[0]);
        }

        if (nonMaskChildrenArray.length >= 1) {
          // console.log(
          //   'nonMaskChildrenArray: ' +
          //     JSON.stringify(nonMaskChildrenArray, null, 2)
          // );
          if (nonMaskChildrenArray.length > 1) {
            var group = ViewGroup.createFromArray(nonMaskChildrenArray);
            tempNewChildrenArray.push(group);
          } else {
            tempNewChildrenArray.push(nonMaskChildrenArray[0]);
          }
        }
        parent.children = tempNewChildrenArray;
      }
    }
  }
}

/* 遍历每个view，找出父容器, 并判断父容器最适合的layout类型*/
function judgeViewTree(rootView, visitFunc) {
  if (rootView) {
    //弄两个队列进行遍历，是为了将来对同一个层级的view进行优化做铺垫
    var queue1 = new Array();
    var queue2 = new Array();

    //先将根节点放到队列1中
    queue1.push(rootView);
    var view;
    while (queue1.length > 0 || queue2.length > 0) {
      while (queue1.length > 0) {
        view = queue1.shift();
        //判断每一层的layout类型
        if (isTypeGroup(view)) {
          //layout判断
          visitFunc(view);

          //将孩子入队，为下一层的判断做准备
          if (view.children) {
            for (var i = 0; i < view.children.length; i++) {
              queue2.push(view.children[i]);
            }
          }
        }
      }

      while (queue2.length > 0) {
        view = queue2.shift();
        if (isTypeGroup(view)) {
          ////layout判断
          visitFunc(view);

          //将孩子入队，为下一层的判断做准备
          if (view.children) {
            for (var i = 0; i < view.children.length; i++) {
              queue1.push(view.children[i]);
            }
          }
        }
      }
    }
  }
}

/** 判断容器布局类型 */
function judgeGroupOrientation(viewGroup) {
  viewGroup.orientation = getGroupOrientation(viewGroup);
  switch (viewGroup.orientation) {
    case ORIENTATION_TYPE.HORIZONTAL:
      viewGroup.viewType = LAYOUT_TYPE.LINEARLAYOUT;
      viewGroup.children = viewGroup.childrenFromLeft;
      setLinearChildrenParams(viewGroup, viewGroup.orientation);
      break;
    case ORIENTATION_TYPE.VERTICAL:
      viewGroup.viewType = LAYOUT_TYPE.LINEARLAYOUT;
      viewGroup.children = viewGroup.childrenFromTop;
      setLinearChildrenParams(viewGroup, viewGroup.orientation);
      break;
    case ORIENTATION_TYPE.ABSOLUTE:
      viewGroup.viewType = LAYOUT_TYPE.FRAMELAYOUT;
      viewGroup.children = viewGroup.childrenFromLeftTop;
      setFrameChildrenParams(viewGroup);
      break;
    default:
      break;
  }
  viewGroup.childrenFromLeft = undefined;
  viewGroup.childrenFromTop = undefined;
  viewGroup.childrenFromLeftTop = undefined;
}

function getGroupOrientation(viewGroup) {
  ViewGroup.sortChildren(viewGroup);

  let orientation = ORIENTATION_TYPE.ABSOLUTE;
  if (viewGroup.children.length > 1) {
    orientation = ORIENTATION_TYPE.HORIZONTAL;
    let length = viewGroup.childrenFromLeft.length;
    for (var index = 0; index < length - 1; index++) {
      var child1 = viewGroup.childrenFromLeft[index];
      var child2 = viewGroup.childrenFromLeft[index + 1];
      if (child1.left + child1.width > child2.left + DELTA_SIZE_3) {
        orientation = ORIENTATION_TYPE.VERTICAL;
        break;
      }
    }
    if (orientation == ORIENTATION_TYPE.VERTICAL) {
      length = viewGroup.childrenFromTop.length;
      for (var index = 0; index < length - 1; index++) {
        var child1 = viewGroup.childrenFromTop[index];
        var child2 = viewGroup.childrenFromTop[index + 1];
        if (child1.top + child1.height > child2.top) {
          orientation = ORIENTATION_TYPE.ABSOLUTE;
          break;
        }
      }
    }
  }
  return orientation;
}

/** 设置child的布局属性 */
function setLinearChildrenParams(viewGroup, orientation) {
  if (viewGroup.children && viewGroup.children.length > 0) {
    let length = viewGroup.children.length;
    let tempLeft = viewGroup.left;
    let tempTop = viewGroup.top;

    if (canSetWrapContentWidth(viewGroup)) {
      viewGroup.wrapContentWidth = true;
    }
    if (canSetWrapContentHeight(viewGroup)) {
      viewGroup.wrapContentHeight = true;
    }

    for (var index = 0; index < length; index++) {
      var child = viewGroup.children[index];
      child.marginLeft = Math.max(0, child.left - tempLeft);
      child.marginTop = Math.max(0, child.top - tempTop);
      child.gravity = undefined;
      if (orientation == ORIENTATION_TYPE.HORIZONTAL) {
        tempLeft += child.marginLeft + child.width;
        if (canSetGravityCenter(child, viewGroup)) {
          child.marginTop = undefined;
          child.gravity = 'center';
        }
      } else if (orientation == ORIENTATION_TYPE.VERTICAL) {
        tempTop += child.marginTop + child.height;
      }
      child.marginLeft = child.marginLeft == 0 ? undefined : child.marginLeft;
      child.marginTop = child.marginTop == 0 ? undefined : child.marginTop;
    }
  }
}

function setFrameChildrenParams(viewGroup) {
  if (viewGroup.children && viewGroup.children.length > 0) {
    let length = viewGroup.children.length;

    if (canSetWrapContentWidth(viewGroup)) {
      viewGroup.wrapContentWidth = true;
    }
    if (canSetWrapContentHeight(viewGroup)) {
      viewGroup.wrapContentHeight = true;
    }
    if (length == 1) {
      var child = viewGroup.children[0];
      if (child.viewType == VIEW_TYPE.TEXT_VIEW && !nativeMode) {
        viewGroup.wrapContentWidth = true;
        viewGroup.wrapContentHeight = true;
        child.marginLeft = child.left - viewGroup.left;
        child.marginTop = child.top - viewGroup.top;
        child.marginRight =
          viewGroup.left + viewGroup.width - child.left - child.width;
        child.marginBottom =
          viewGroup.top + viewGroup.height - child.top - child.height;
        child.textGravity = 'center';
      } else {
        viewGroup.children[0].gravity = 'center';
      }
    } else if (
      length == 2 &&
      isSameArea(viewGroup.children[0], viewGroup) &&
      viewGroup.children[1].viewType == VIEW_TYPE.TEXT_VIEW
    ) {
      viewGroup.children[1].gravity = 'center';
    } else {
      let tempLeft = viewGroup.left;
      let tempTop = viewGroup.top;
      for (var index = 0; index < length; index++) {
        var child = viewGroup.children[index];
        child.marginLeft = Math.max(0, child.left - tempLeft);
        child.marginLeft = child.marginLeft == 0 ? undefined : child.marginLeft;
        child.gravity = undefined;
        if (canSetGravityCenter(child, viewGroup)) {
          child.marginTop = undefined;
          child.gravity = getAttrsValue('leftCenter');
        } else if (canSetGravityBottom(child, viewGroup)) {
          child.marginTop = undefined;
          child.gravity = getAttrsValue('leftBottom');
        } else {
          child.marginTop = Math.max(0, child.top - tempTop);
          child.marginTop = child.marginTop == 0 ? undefined : child.marginTop;
        }
      }
    }
  }
}

function canSetGravityCenter(child, group) {
  return deltaDiff5(child.top + child.height / 2, group.top + group.height / 2);
}

function canSetGravityBottom(child, group) {
  return deltaDiff5(child.top + child.height, group.top + group.height);
}

function canSetWrapContentWidth(group) {
  var can = false;
  if (!(isDefined(group) && group.id == 'root_group')) {
    let w = 0;
    for (var index = 0; index < group.children.length; index++) {
      var child = group.children[index];
      if (child.left + child.width == group.left + group.width) {
        can = true;
        break;
      }
    }
  }

  return can;
}

function canSetWrapContentHeight(group) {
  var can = false;
  if (!(isDefined(group) && group.id == 'root_group')) {
    for (var index = 0; index < group.children.length; index++) {
      var child = group.children[index];
      if (Math.abs(child.height - group.height) <= 1) {
        can = true;
        break;
      }
    }
  }
  return can;
}

/******************************************************
                      Widget Extract(json数据与组件映射)
 ******************************************************/

var View = function () {
  var id;
  this.viewType = VIEW_TYPE.VIEW;
  var width;
  var height;
  var left;
  var top;

  var overflow;
  var backgroundColor;
  var cornerRadius;
  var borderWidth;
  var borderColor;
  var opacity;

  var cornerRadiusLeftTop;
  var cornerRadiusRightTop;
  var cornerRadiusLeftBottom;
  var cornerRadiusRightBottom;

  var marginLeft;
  var marginRight;
  var marginTop;
  var marginBottom;
  var gravity;

  var depth;
  var description;
  var defaultValue;
};

View.create = function (propsJsonData) {
  var viewObj = new View();
  viewObj.initParams(propsJsonData);
  return viewObj;
};

View.prototype.initParams = function (propsJsonData) {
  this.depth = 0;
  if (propsJsonData && typeof propsJsonData == 'object') {
    let styleJsonData = propsJsonData.style;
    if (styleJsonData && typeof styleJsonData == 'object') {
      this.width = Math.min(750, Math.round(styleJsonData.width));
      this.height = Math.round(styleJsonData.height);
      this.left = Math.round(styleJsonData.left ? styleJsonData.left : 0);
      this.top = Math.round(styleJsonData.top ? styleJsonData.top : 0);
      if (isDefined(styleJsonData.opacity)) {
        this.opacity = styleJsonData.opacity;
      }
      if (isDefined(styleJsonData.backgroundColor)) {
        this.backgroundColor = transRGBAColor2HexWithOpacity(
          styleJsonData.backgroundColor,
          this.opacity
        );
      } else if (isDefined(styleJsonData.backgroundImage)) {
        let backgroundImage = styleJsonData.backgroundImage;
        let tempStr = backgroundImage.substring(
          backgroundImage.indexOf('(') + 1,
          backgroundImage.lastIndexOf(')')
        );
        let rgb = tempStr.split(', ');
        if (rgb && rgb.length == 3) {
          this.backgroundColor = transRGBAColor2HexWithOpacity(
            rgb[2],
            this.opacity
          );
          this.description = `<!-- backgroundColor是渐变色，注意检查是否需要处理成图片 ${
            transRGBAColor2HexWithOpacity(rgb[1], this.opacity) +
            ',' +
            transRGBAColor2HexWithOpacity(rgb[2], this.opacity)
          } -->`;
        }
      }

      if (
        isDefined(styleJsonData.borderTopLeftRadius) &&
        styleJsonData.borderTopLeftRadius > 0
      ) {
        this.cornerRadiusLeftTop = Math.round(
          Math.min(styleJsonData.borderTopLeftRadius, this.height / 2)
        );
      }
      if (
        isDefined(styleJsonData.borderTopRightRadius) &&
        styleJsonData.borderTopRightRadius > 0
      ) {
        this.cornerRadiusRightTop = Math.round(
          Math.min(styleJsonData.borderTopRightRadius, this.height / 2)
        );
      }
      if (
        isDefined(styleJsonData.borderBottomLeftRadius) &&
        styleJsonData.borderBottomLeftRadius > 0
      ) {
        this.cornerRadiusLeftBottom = Math.round(
          Math.min(styleJsonData.borderBottomLeftRadius, this.height / 2)
        );
      }
      if (
        isDefined(styleJsonData.borderBottomRightRadius) &&
        styleJsonData.borderBottomRightRadius > 0
      ) {
        this.cornerRadiusRightBottom = Math.round(
          Math.min(styleJsonData.borderBottomRightRadius, this.height / 2)
        );
      }

      if (
        isDefined(styleJsonData.borderRadius) &&
        styleJsonData.borderRadius > 0
      ) {
        this.cornerRadius = Math.round(
          Math.min(styleJsonData.borderRadius, this.height / 2)
        );
      }
      if (
        isDefined(styleJsonData.borderWidth) &&
        styleJsonData.borderWidth > 0
      ) {
        this.borderWidth = Math.round(styleJsonData.borderWidth);
      }
      if (isDefined(styleJsonData.borderColor)) {
        this.borderColor = transRGBAColor2HexWithOpacity(
          styleJsonData.borderColor
        );
      }
      if (isDefined(styleJsonData.overflow)) {
        this.overflow = styleJsonData.overflow;
      }
    }
  }
};

View.prototype.exportBasicDSL = function () {
  // 如果圆角属性都是一样的 替换成cornerRadius属性
  if (
    isDefined(this.cornerRadiusLeftTop) &&
    isDefined(this.cornerRadiusRightTop) &&
    isDefined(this.cornerRadiusLeftBottom) &&
    isDefined(this.cornerRadiusRightBottom)
  ) {
    if (
      this.cornerRadiusLeftTop == this.cornerRadiusRightTop &&
      this.cornerRadiusLeftBottom == this.cornerRadiusRightBottom &&
      this.cornerRadiusLeftTop == this.cornerRadiusLeftBottom
    ) {
      this.cornerRadius = this.cornerRadiusLeftTop;
      this.cornerRadiusLeftTop = undefined;
      this.cornerRadiusRightTop = undefined;
      this.cornerRadiusLeftBottom = undefined;
      this.cornerRadiusRightBottom = undefined;
    }
  }

  let attrs = {};
  // if (nativeMode) {
  //   if (this.id) {
  //     attrs["id"] = `@+id/${this.id.toLowerCase()}`;
  //   }
  // }
  attrs[getAttrsName('width')] =
    scalePoint(this.width) == 0.5 ? '0.5np' : scalePoint(this.width);
  attrs[getAttrsName('height')] =
    scalePoint(this.height) == 0.5 ? '0.5np' : scalePoint(this.height);
  if (isDefined(this.marginLeft) && this.marginLeft != 0) {
    attrs[getAttrsName('marginLeft')] = scalePoint(this.marginLeft);
  }
  if (isDefined(this.marginRight) && this.marginRight != 0) {
    attrs[getAttrsName('marginRight')] = scalePoint(this.marginRight);
  }
  if (isDefined(this.marginTop) && this.marginTop != 0) {
    attrs[getAttrsName('marginTop')] = scalePoint(this.marginTop);
  }
  if (isDefined(this.marginBottom) && this.marginBottom != 0) {
    attrs[getAttrsName('marginBottom')] = scalePoint(this.marginBottom);
  }
  if (nativeMode && this.depth == 0 && !isDefined(this.backgroundColor)) {
    this.backgroundColor = '#FFFFFF';
  }
  if (isDefined(this.backgroundColor)) {
    attrs[getAttrsName('backgroundColor')] = this.backgroundColor;
  }
  if (!nativeMode) {
    if (isDefined(this.cornerRadius) && this.cornerRadius > 0) {
      attrs[getAttrsName('cornerRadius')] = scalePoint(this.cornerRadius);
    }
    if (isDefined(this.cornerRadiusLeftTop) && this.cornerRadiusLeftTop > 0) {
      attrs[getAttrsName('cornerRadiusLeftTop')] = scalePoint(
        this.cornerRadiusLeftTop
      );
    }
    if (isDefined(this.cornerRadiusRightTop) && this.cornerRadiusRightTop > 0) {
      attrs[getAttrsName('cornerRadiusRightTop')] = scalePoint(
        this.cornerRadiusRightTop
      );
    }
    if (
      isDefined(this.cornerRadiusLeftBottom) &&
      this.cornerRadiusLeftBottom > 0
    ) {
      attrs[getAttrsName('cornerRadiusLeftBottom')] = scalePoint(
        this.cornerRadiusLeftBottom
      );
    }
    if (
      isDefined(this.cornerRadiusRightBottom) &&
      this.cornerRadiusRightBottom > 0
    ) {
      attrs[getAttrsName('cornerRadiusRightBottom')] = scalePoint(
        this.cornerRadiusRightBottom
      );
    }
    if (isDefined(this.borderWidth) && this.borderWidth > 0) {
      attrs[getAttrsName('borderWidth')] =
        scalePoint(this.borderWidth) == 0.5
          ? '0.5np'
          : scalePoint(this.borderWidth);
    }
    if (isDefined(this.borderColor)) {
      attrs[getAttrsName('borderColor')] = this.borderColor;
    }
  } else {
    if (isDefined(this.borderColor) && !isDefined(this.backgroundColor)) {
      attrs[getAttrsName('backgroundColor')] = this.borderColor;
    }
  }
  if (isDefined(this.gravity)) {
    attrs[getAttrsName('gravity')] = this.gravity;
  }
  return attrs;
};

View.prototype.exportDSL = function () {
  let result = '';
  if (isDefined(this.description)) {
    result += getIndent(this.depth) + this.description + '\n';
  }
  result += getIndent(this.depth);
  result += `<${getWidgetTag(this.viewType)} `;
  let attrs = this.exportBasicDSL();
  result += `${formatAttrs(attrs, getIndent(this.depth + 1))} />`;
  return result;
};

var ViewGroup = function () {
  View.call(this, arguments);
  this.viewType = VIEW_TYPE.GROUP;
  var orientation;
  var gravity;
  var children;
  var childrenFromLeft;
  var childrenFromTop;
  var childrenFromLeftTop;

  var wrapContentWidth;
  var wrapContentHeight;

  var overlapChekced;
  var innerChildChecked;
  var linearCheckedDirection;
};

ViewGroup.prototype = new View();

ViewGroup.create = function (propsJsonData) {
  var viewGroup = new ViewGroup();
  viewGroup.initGroupParams(propsJsonData);
  return viewGroup;
};

/** 归拢后的控件层级深度重新设置 */
function resetChildDepth(children, delta) {
  children.forEach(function (child) {
    child.depth += delta;
    if (isTypeGroup(child) && child.children && child.children.length > 0) {
      resetChildDepth(child.children, delta);
    }
  });
}

/** 存在重叠关系的控件用一个group进行归拢 */
ViewGroup.createFromArray = function (overlapArray) {
  var viewGroup = new ViewGroup();
  viewGroup.id = `group_new_${overlapArray[0].id}`;
  viewGroup.depth = overlapArray[0].depth;

  resetChildDepth(overlapArray, 1);

  let left = -1;
  let top = -1;
  let right = -1;
  let bottom = -1;

  overlapArray.forEach(function (child) {
    left = left == -1 ? child.left : Math.min(left, child.left);
    top = top == -1 ? child.top : Math.min(top, child.top);
    right =
      right == -1
        ? child.left + child.width
        : Math.max(right, child.left + child.width);
    bottom =
      bottom == -1
        ? child.top + child.height
        : Math.max(bottom, child.top + child.height);
  });

  viewGroup.left = left;
  viewGroup.top = top;
  viewGroup.width = right - left;
  viewGroup.height = bottom - top;

  for (var i = 0; i < overlapArray.length; i++) {
    var child = overlapArray[i];
    if (childToParentBackground(child, viewGroup)) {
      overlapArray.splice(i, 1);
    }
  }

  if (
    overlapArray.length == 1 &&
    isTypeGroup(overlapArray[0]) &&
    overlapArray[0].children &&
    overlapArray[0].children.length > 0
  ) {
    copyChildAttrToParent(overlapArray[0], viewGroup);
    var tempArray = new Array();
    overlapArray[0].children.forEach(function (c) {
      tempArray.push(c);
    });
    resetChildDepth(overlapArray, -1);
    viewGroup.children = tempArray;
  } else {
    viewGroup.children = overlapArray;
  }
  viewGroup.linearCheckedDirection = getGroupOrientation(viewGroup);
  viewGroup.childrenFromLeft = undefined;
  viewGroup.childrenFromTop = undefined;
  viewGroup.childrenFromLeftTop = undefined;
  return viewGroup;
};

ViewGroup.prototype.initGroupParams = function (propsJsonData) {
  this.initParams(propsJsonData);
  this.children = [];
};

/** 存在重叠关系时的排序顺序，高度更大的展示在下，overflow属性为hidden的展示在下 */
function sortByTop(view1, view2) {
  if (view1.top == view2.top) {
    var d = view2.top + view2.height - view1.top - view1.height;
    if (d == 0) {
      if (!isDefined(view1.overflow) || !isDefined(view2.overflow)) {
        if (isDefined(view1.overflow)) {
          return -1;
        }
        if (isDefined(view2.overflow)) {
          return 1;
        }
      }
    }
    return d;
  } else {
    return view1.top - view2.top;
  }
}

ViewGroup.sortChildren = function (viewGroup) {
  if (viewGroup.children && viewGroup.children.length > 0) {
    var tmpSortedH = viewGroup.children.slice(0);
    var tmpSortedV = viewGroup.children.slice(0);
    tmpSortedH.sort(function (view1, view2) {
      return view1.left - view2.left;
    });
    tmpSortedV.sort(function (view1, view2) {
      return sortByTop(view1, view2);
    });

    viewGroup.childrenFromLeft = tmpSortedV.slice(0);
    viewGroup.childrenFromLeft.sort(function (view1, view2) {
      if (deltaDiff5(view1.left, view2.left)) {
        return sortByTop(view1, view2);
      } else {
        return view1.left - view2.left;
      }
    });

    viewGroup.childrenFromTop = tmpSortedH.slice(0);
    viewGroup.childrenFromTop.sort(function (view1, view2) {
      if (deltaDiff5(view1.top, view2.top)) {
        return view1.left - view2.left;
      } else {
        return sortByTop(view1, view2);
      }
    });
    viewGroup.childrenFromLeftTop = tmpSortedV.slice(0);
    viewGroup.childrenFromLeftTop.sort(function (view1, view2) {
      var distance1 = Math.pow(view1.top, 2) + Math.pow(view1.left, 2);
      var distance2 = Math.pow(view2.top, 2) + Math.pow(view2.left, 2);

      if (deltaDiff3(distance1, distance2)) {
        return view1.top - view2.top;
      } else {
        return distance1 - distance2;
      }
    });
  }
};

ViewGroup.prototype.exportDSL = function () {
  var result = '';

  let namespace = '';
  let layoutStartTag = '';
  let layoutEndTag = '';
  let parentIndent = getIndent(this.depth);

  let attrs = {};

  if (this.depth == 0) {
    result += getXMLHeader();
    namespace = getNameSpace();
  }

  if (isDefined(this.description)) {
    result += parentIndent + this.description + '\n';
  }

  layoutStartTag = `<${getWidgetTag(this.viewType)} ${namespace}`;
  layoutEndTag = `</${getWidgetTag(this.viewType)}>`;

  result += parentIndent + layoutStartTag;

  attrs = this.exportBasicDSL();
  if (this.wrapContentWidth) {
    attrs[getAttrsName('width')] = getAttrsValue('match_content');
  }
  if (this.wrapContentHeight) {
    attrs[getAttrsName('height')] = getAttrsValue('match_content');
  }
  if (
    isDefined(this.orientation) &&
    this.orientation != ORIENTATION_TYPE.ABSOLUTE
  ) {
    attrs[getAttrsName('orientation')] = this.orientation;
  }
  result += `${formatAttrs(attrs, getIndent(this.depth + 1))}>`;

  if (this.children && this.children.length > 0) {
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      result += '\n\n';
      result += child.exportDSL();
    }
  }

  result += '\n\n' + parentIndent + layoutEndTag;

  return result;
};

var TextView = function () {
  View.call(this, arguments);
  this.viewType = VIEW_TYPE.TEXT_VIEW;
  var text;
  var fontSize;
  var color;
  var textGravity;
  var lines;
  var fixed;
  var strikeThrough;
  var priceModel;
};

TextView.prototype = new View();

TextView.create = function (propsJsonData) {
  var textView = new TextView();
  textView.initTextParams(propsJsonData);
  return textView;
};

TextView.prototype.initTextParams = function (propsJsonData) {
  this.initParams(propsJsonData);
  if (propsJsonData && typeof propsJsonData == 'object') {
    let styleJsonData = propsJsonData.style;
    if (styleJsonData && typeof styleJsonData == 'object') {
      this.fontSize = Math.round(styleJsonData.fontSize);
      this.color = transRGBAColor2HexWithOpacity(
        styleJsonData.color,
        this.opacity
      );
      if (isDefined(styleJsonData.lines)) {
        this.lines = Math.round(styleJsonData.lines);
      } else {
        this.lines = 1;
      }
    }
    if (propsJsonData.children) {
      this.text = propsJsonData.children;
    } else {
      this.text = '';
    }
    if (!nativeMode) {
      this.defaultValue = `<!--  text=${this.text} -->`;
    }
    if (propsJsonData.fixed) {
      this.fixed = propsJsonData.fixed;
    }
  }
};

TextView.prototype.exportDSL = function () {
  findDataBinding(this);

  if (!this.mocked) {
    resolveMockData(this);
  }

  let parentIndent = getIndent(this.depth);
  let result = '';
  if (isDefined(this.description)) {
    result += parentIndent + this.description + '\n';
  }
  if (isDefined(this.defaultValue)) {
    result += parentIndent + this.defaultValue + '\n';
  }
  result += parentIndent;
  result += isDefined(this.priceModel)
    ? '<RPriceView '
    : `<${getWidgetTag(this.viewType)} `;
  let attrs = this.exportBasicDSL();
  if (!this.fixed) {
    attrs[getAttrsName('width')] = getAttrsValue('match_content');
  }
  attrs[getAttrsName('height')] = getAttrsValue('match_content');
  if (!isDefined(this.priceModel)) {
    attrs[getAttrsName('lineBreakMode')] = 'end';
  }
  if (isDefined(this.fontSize)) {
    if (isDefined(this.priceModel)) {
      attrs['rPriceTextSize'] = scalePoint(this.fontSize);
    } else {
      attrs[getAttrsName('textSize')] = scalePoint(this.fontSize);
    }
  }
  if (isDefined(this.color)) {
    if (isDefined(this.priceModel)) {
      attrs['rPriceTextColor'] = this.color;
    } else {
      attrs[getAttrsName('textColor')] = this.color;
    }
  }
  if (isDefined(this.lines) && !isDefined(this.priceModel)) {
    attrs[getAttrsName('maxLines')] = this.lines;
  }
  if (isDefined(this.textGravity) && !isDefined(this.priceModel)) {
    attrs[getAttrsName('textGravity')] = this.textGravity;
  }
  if (isDefined(this.strikeThrough)) {
    if (targetDSLType == RULE_TYPE.RULE_2) {
      attrs['dStrikeThroughStyle'] = 'single';
    } else {
      attrs['isStrikeThrough'] = true;
    }
  }
  if (isDefined(this.text)) {
    if (isDefined(this.priceModel)) {
      attrs['rPriceText'] = '@data{data.price}';
    } else {
      attrs[getAttrsName('text')] = this.text.replace(
        new RegExp('\n', 'gm'),
        ''
      );
    }
  }
  result += `${formatAttrs(attrs, getIndent(this.depth + 1))} />`;
  return result;
};

var ImageView = function () {
  View.call(this, arguments);
  this.viewType = VIEW_TYPE.IMAGE_VIEW;
  var src;
  var aspectRatio;
  var scaleType;
};

ImageView.prototype = new View();

ImageView.create = function (propsJsonData) {
  var imageview = new ImageView();
  imageview.initImageParams(propsJsonData);
  return imageview;
};

ImageView.prototype.initImageParams = function (propsJsonData) {
  this.initParams(propsJsonData);
  if (propsJsonData && typeof propsJsonData == 'object') {
    this.src = propsJsonData.src;
    if (!nativeMode) {
      this.defaultValue = `<!--  url=${this.src} -->`;
    }
  }

  if (!nativeMode) {
    if (this.overflow == 'hidden') {
      this.description = `<!-- 图片控件请业务方Check, PS：检查图片是否冗余！！ -->`;
    } else {
      this.description = `<!-- 图片控件请业务方Check -->`;
    }
  }
};

ImageView.prototype.exportDSL = function () {
  findDataBinding(this);

  if (!this.mocked) {
    resolveMockData(this);
  }

  let result = '';
  if (isDefined(this.description)) {
    result += getIndent(this.depth) + this.description + '\n';
  }
  if (isDefined(this.defaultValue)) {
    result += getIndent(this.depth) + this.defaultValue + '\n';
  }
  result += getIndent(this.depth);
  result += `<${getWidgetTag(this.viewType)} `;
  let attrs = this.exportBasicDSL();
  if (isDefined(this.src)) {
    attrs[getAttrsName('imageUrl')] = this.src;
  }
  result += `${formatAttrs(attrs, getIndent(this.depth + 1))} />`;
  return result;
};

var HashMap = function () {
  /** Map 大小 **/
  var size;
  /** 对象 **/
  var entry;

  /** 存 **/
  this.put = function (key, value) {
    if (!this.containsKey(key)) {
      this.size++;
    }
    this.entry[key] = value;
  };

  /** 取 **/
  this.get = function (key) {
    if (this.containsKey(key)) {
      return this.entry[key];
    } else {
      return null;
    }
  };

  /** 删除 **/
  this.remove = function (key) {
    if (delete this.entry[key]) {
      this.size--;
    }
  };

  /** 是否包含 Key **/
  this.containsKey = function (key) {
    return key in this.entry;
  };

  /** 是否包含 Value **/
  this.containsValue = function (value) {
    for (var prop in this.entry) {
      if (this.entry[prop] == value) {
        return true;
      }
    }
    return false;
  };

  /** 所有 Value **/
  this.values = function () {
    var values = new Array(size);
    for (var prop in this.entry) {
      values.push(this.entry[prop]);
    }
    return values;
  };

  /** 所有 Key **/
  this.keys = function () {
    var keys = new Array(size);
    for (var prop in this.entry) {
      keys.push(prop);
    }
    return keys;
  };

  /** Map Size **/
  this.size = function () {
    return this.size;
  };
};

HashMap.create = function () {
  var mapObj = new HashMap();
  mapObj.size = 0;
  mapObj.entry = new Object();
  return mapObj;
};

/******************************************************
                      Tools （色值转换器）
 ******************************************************/

/** 将255色值转换为2位Hex字符，不足两位补0 */
function transRGB2HexStr(c) {
  if (typeof c !== 'string') {
    return '';
  }
  var d = Math.abs(parseFloat(c));
  d = Math.min(0xff, d);
  let hex = d.toString(16);
  return d > 0xf ? hex : `0${hex}`;
}

/** 将alpha值转换为2位Hex字符，不足两位补0 */
function transAlpha2HexStr(alpha) {
  if (typeof alpha !== 'string') {
    return '';
  }
  var d = Math.abs(parseFloat(alpha));
  d = Math.min(0xff, Math.round(d * 0xff));
  if (d == 0xff) {
    return '';
  }
  let hex = d.toString(16);
  return d > 0xf ? hex : `0${hex}`;
}

/**
 * 将RGBA色值转换为以#开始的ARGB字符串
 * 例如127,127,127,1 => #ff8f8f8f
 */
function transRGBA2ARGB(r, g, b, a) {
  a = transAlpha2HexStr(a);
  r = transRGB2HexStr(r);
  g = transRGB2HexStr(g);
  b = transRGB2HexStr(b);
  if (r.length > 0 && g.length > 0 && b.length > 0) {
    return `#${a}${r}${g}${b}`;
  }
  return '';
}

/** 将RGB(A)字符串转换为以#开始的ARGB字符串
 *  例如rgb(235,235,235,1) => #ebebeb
 */
function transRGBAColor2HexWithOpacity(str, opacity) {
  if (typeof str !== 'string') {
    return str;
  }

  if (str.length > 4 && str.substr(0, 4) == 'rgb(') {
    let rgb = str.slice(4, -1).split(',');
    if (rgb.length == 3) {
      return transRGBA2ARGB(
        rgb[0],
        rgb[1],
        rgb[2],
        isValidValue(opacity) ? `${opacity}` : null
      );
    } else if (rgb.length == 4) {
      return transRGBA2ARGB(
        rgb[0],
        rgb[1],
        rgb[2],
        isValidValue(opacity) ? `${opacity}` : rgb[3]
      );
    }
  } else if (str.length > 5 && str.substr(0, 5) == 'rgba(') {
    let rgb = str.slice(5, -1).split(',');
    if (rgb.length == 4) {
      return transRGBA2ARGB(
        rgb[0],
        rgb[1],
        rgb[2],
        isValidValue(opacity) ? `${opacity}` : rgb[3]
      );
    }
  } else if (
    str.length == 7 &&
    str.substr(0, 1) == '#' &&
    isValidValue(opacity)
  ) {
    let a = transAlpha2HexStr(`${opacity}`);
    return `#${a}${str.substr(1, str.length)}`;
  } else if (
    str.length == 9 &&
    str.substr(0, 1) == '#' &&
    isValidValue(opacity)
  ) {
    let a = transAlpha2HexStr(`${opacity}`);
    return `#${a}${str.substr(3, str.length)}`;
  }
  return str;
}

/******************************************************
                      Tools （工具类）
 ******************************************************/

/** 将驼峰命名统一成以-分割 */
function trans2LowerDash(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/** 对像素点进行统一缩放 */
function scalePoint(x) {
  let num = parseFloat(x);
  num /= SCALE_FACTOR;
  if (nativeMode) {
    num += 'dp';
  }
  return num;
}

function getIndent(depth) {
  let attrsIndent = '';
  for (var i = 0; i < depth; i++) {
    attrsIndent += LINE_INDENT;
  }
  return attrsIndent;
}

const formatAttrs = function (attrs, indent) {
  var ret = '';
  var sorted = Object.keys(attrs);
  sorted.forEach(function (s) {
    ret += '\n' + indent;
    ret += ` ${getAttrsPrefix() + s}="${attrs[s]}"`;
  });
  return ret;
};

function deltaDiff3(value1, value2) {
  return Math.abs(value1 - value2) <= DELTA_SIZE_3;
}

function deltaDiff5(value1, value2) {
  return Math.abs(value1 - value2) <= DELTA_SIZE_5;
}

var isDefined = function (para) {
  return typeof para !== 'undefined';
};

var isValidValue = function (para) {
  return isDefined(para) && !isNullValue(para) && !isEmpty(para);
};
var isNullValue = function (para) {
  return para == null;
};

var isEmpty = function (para) {
  return para == '';
};

var isContainPosition = function (position, positionArray) {
  let contain = false;
  for (var i = 0; i < positionArray.length; i++) {
    if (positionArray[i] == position) {
      contain = true;
      break;
    }
  }
  return contain;
};

var isTypeGroup = function (view) {
  switch (view.viewType) {
    case VIEW_TYPE.GROUP:
    case LAYOUT_TYPE.LINEARLAYOUT:
    case LAYOUT_TYPE.FRAMELAYOUT:
      return true;
    default:
      return false;
  }
};

/** DView可以作为父容器背景 将child的相关属性合并到父容器  */
var childToParentBackground = function (childView, viewGroup) {
  if (
    isSameArea(childView, viewGroup) &&
    childView.viewType == VIEW_TYPE.VIEW &&
    (childView.backgroundColor ||
      childView.borderColor) /** && !childView.description */
  ) {
    copyChildAttrToParent(childView, viewGroup);
    return true;
  }
  return false;
};

function copyChildAttrToParent(childView, viewGroup) {
  if (isDefined(childView.overflow)) {
    viewGroup.overflow = childView.overflow;
  }
  if (isDefined(childView.backgroundColor)) {
    viewGroup.backgroundColor = childView.backgroundColor;
  }
  if (isDefined(childView.borderColor)) {
    viewGroup.borderColor = childView.borderColor;
  }
  if (isDefined(childView.borderWidth)) {
    viewGroup.borderWidth = childView.borderWidth;
  }
  if (isDefined(childView.cornerRadius)) {
    viewGroup.cornerRadius = childView.cornerRadius;
  }
  if (isDefined(childView.cornerRadiusLeftTop)) {
    viewGroup.cornerRadiusLeftTop = childView.cornerRadiusLeftTop;
  }
  if (isDefined(childView.cornerRadiusRightTop)) {
    viewGroup.cornerRadiusRightTop = childView.cornerRadiusRightTop;
  }
  if (isDefined(childView.cornerRadiusLeftBottom)) {
    viewGroup.cornerRadiusLeftBottom = childView.cornerRadiusLeftBottom;
  }
  if (isDefined(childView.cornerRadiusRightBottom)) {
    viewGroup.cornerRadiusRightBottom = childView.cornerRadiusRightBottom;
  }
  if (isDefined(childView.description)) {
    viewGroup.description = childView.description;
  }
}

/** 展示区域一致 */
var isSameArea = function (childView, viewGroup) {
  return (
    deltaDiff3(childView.left, viewGroup.left) &&
    deltaDiff3(childView.top, viewGroup.top) &&
    deltaDiff3(childView.width, viewGroup.width) &&
    deltaDiff3(childView.height, viewGroup.height)
  );
};

/** 存在重叠 有些价格的文本被拆解后存在误差 eg:￥19.89 */
var isOverlapRelationship = function (view1, view2) {
  return !(
    view1.left + DELTA_SIZE_3 >= view2.left + view2.width ||
    view1.top >= view2.top + view2.height ||
    view2.left + DELTA_SIZE_3 >= view1.left + view1.width ||
    view2.top >= view1.top + view1.height
  );
};

/** 1 <view1在view2右边>  -1 <view1在view2左边> */
var isHorizontalRelationship = function (view1, view2, parent) {
  if (
    deltaDiff5(
      view1.top + view1.height / 2,
      view2.top + view2.height / 2
    ) /*|| (view1.top <= view2.top && view1.top + view1.height >= view2.top + view2.height) || (view2.top <= view1.top && view2.top + view2.height >= view1.top + view1.height)*/
  ) {
    if (view1.left + DELTA_SIZE_5 >= view2.left + view2.width) {
      let x1 = view2.left + view2.width;
      let x2 = view1.left;
      let y1 = Math.min(view1.top, view2.top);
      let y2 = Math.max(view1.top + view1.height, view2.top + view2.height);
      if (x2 > x1) {
        var tempv = new View();
        tempv.left = x1;
        tempv.width = x2 - x1;
        tempv.top = y1;
        tempv.height = y2 - y1;
        for (var i = 0; i < parent.children.length; i++) {
          let v = parent.children[i];
          if (
            v.id != view1.id &&
            v.id != view2.id &&
            v.left != parent.left &&
            v.width != parent.width &&
            isOverlapRelationship(v, tempv)
          ) {
            return undefined;
          }
        }
      }
      return 1;
    } else if (view2.left + DELTA_SIZE_5 >= view1.left + view1.width) {
      let x1 = view1.left + view1.width;
      let x2 = view2.left;
      let y1 = Math.min(view1.top, view2.top);
      let y2 = Math.max(view1.top + view1.height, view2.top + view2.height);
      if (x2 > x1) {
        var tempv = new View();
        tempv.left = x1;
        tempv.width = x2 - x1;
        tempv.top = y1;
        tempv.height = y2 - y1;
        for (var i = 0; i < parent.children.length; i++) {
          let v = parent.children[i];
          if (
            v.id != view1.id &&
            v.id != view2.id &&
            v.left != parent.left &&
            v.width != parent.width &&
            isOverlapRelationship(v, tempv)
          ) {
            return undefined;
          }
        }
      }
      return -1;
    }
  }
  return undefined;
};

/** 1 <view1在view2下边>  -1 <view1在view2上边> */
var isVerticalRelationship = function (view1, view2, parent) {
  if (
    !isOverlapRelationship(view1, view2) &&
    !isDefined(isHorizontalRelationship(view1, view2, parent))
  ) {
    if (view1.top >= view2.top + view2.height) {
      // console.log("vvvv: " + view1.id + ", "+ view2.id);
      return 1;
    } else if (view2.top >= view1.top + view1.height) {
      // console.log("vvvv: " + view1.id + ", "+ view2.id);
      return -1;
    }
  }
  return undefined;
};

var isInnerChild = function (v1, v2) {
  return (
    (v2.left >= v1.left &&
      v2.left + v2.width <= v1.left + v1.width &&
      v2.top >= v1.top &&
      v2.top + v2.height <= v1.top + v1.height) ||
    (v1.left >= v2.left &&
      v1.left + v1.width <= v2.left + v2.width &&
      v1.top >= v2.top &&
      v1.top + v1.height <= v2.top + v2.height &&
      deltaDiff5(v1.top + v1.height / 2, v2.top + v2.height / 2))
  );
};

var isStrikeThroughStyle = function (group) {
  if (group.children && group.children.length == 2) {
    if (
      group.children[0].viewType == VIEW_TYPE.TEXT_VIEW &&
      group.children[1].viewType == VIEW_TYPE.VIEW &&
      group.children[1].height == 1
    ) {
      group.children[0].strikeThrough = true;
      group.children[0].depth--;
      return group.children[0];
    } else if (
      group.children[1].viewType == VIEW_TYPE.TEXT_VIEW &&
      group.children[0].viewType == VIEW_TYPE.VIEW &&
      group.children[0].height == 1
    ) {
      group.children[1].strikeThrough = true;
      group.children[1].depth--;
      return group.children[1];
    }
  }
  return null;
};

// "price": {
//   "cent": "9",
//   "separator": ".",
//   "symbol": "￥",
//   "unit": "",
//   "yuan": "999"
// }
var isPriceTextWidget = function (group) {
  if (findoutPriceModel && group.children) {
    let valid = true;
    let hasDollar = false;
    let attrs = {};
    group.children.forEach(function (child) {
      if (child.viewType != VIEW_TYPE.TEXT_VIEW) {
        valid = false;
      } else {
        if (child.text.substr(0, 1) == '¥') {
          hasDollar = true;
        } else {
          // console.log('child.text: ' + child.text.substr(0, 1));
        }
      }
    });

    // console.log('isPriceTextWidget: ' + "valid=" + valid + ", hasDollar=" + hasDollar);
    if (valid && hasDollar) {
      attrs['separator'] = '';
      attrs['cent'] = '';
      attrs['unit'] = '';
      group.children.forEach(function (child) {
        if (child.text.substr(0, 1) == '¥') {
          attrs['symbol'] = child.text;
        } else if (child.text.substr(0, 1) == '.') {
          attrs['separator'] = child.text.substr(0, 1);
          attrs['cent'] = child.text.substr(1, child.text.length);
        } else {
          attrs['yuan'] = child.text;
        }
      });
      group.children[0].mocked = false;
      if (isValidValue(attrs['separator'])) {
        group.children[0].defaultValue = `<!--  text=${attrs['symbol']}${attrs['yuan']}${attrs['separator']}${attrs['cent']} -->`;
      } else {
        group.children[0].defaultValue = `<!--  text=${attrs['symbol']}${attrs['yuan']} -->`;
      }
      group.children[0].priceModel = attrs;
      group.children[0].left = group.left;
      group.children[0].top = group.top;
      group.children[0].width = group.width;
      group.children[0].height = group.height;
      group.children[0].depth--;
      return group.children[0];
    }
  }
  return null;
};

function equalsIgnoreCase(str1, str2) {
  return str1.toUpperCase() == str2.toUpperCase();
}

function getNameSpace() {
  if (targetDSLType == RULE_TYPE.RULE_2) {
    return DINAMIC_NAMESPACE;
  } else if (targetDSLType == RULE_TYPE.RULE_N) {
    return ANDROID_NAMESPACE;
  }
  return '';
}

function getXMLHeader() {
  if (targetDSLType != RULE_TYPE.RULE_3) {
    return XML_HEADER;
  } else {
    return ISSUE_LINK;
  }
}

function getWidgetTag(widgetType) {
  if (widgetType == LAYOUT_TYPE.LINEARLAYOUT) {
    if (targetDSLType == RULE_TYPE.RULE_2) {
      return 'DLinearLayout';
    } else {
      return 'LinearLayout';
    }
  } else if (widgetType == LAYOUT_TYPE.FRAMELAYOUT) {
    if (targetDSLType == RULE_TYPE.RULE_2) {
      return 'DFrameLayout';
    } else {
      return 'FrameLayout';
    }
  } else if (widgetType == VIEW_TYPE.IMAGE_VIEW) {
    if (targetDSLType == RULE_TYPE.RULE_2) {
      return 'HImageView';
    } else {
      return 'ImageView';
    }
  } else if (widgetType == VIEW_TYPE.TEXT_VIEW) {
    if (targetDSLType == RULE_TYPE.RULE_2) {
      return 'DTextView';
    } else {
      return 'TextView';
    }
  } else if (widgetType == VIEW_TYPE.VIEW) {
    if (targetDSLType == RULE_TYPE.RULE_2) {
      return 'DView';
    } else {
      return 'View';
    }
  }
}

function getAttrsPrefix() {
  let prefix = '';
  if (targetDSLType == RULE_TYPE.RULE_2) {
    prefix = 'dinamic:';
  } else if (targetDSLType == RULE_TYPE.RULE_N) {
    prefix = 'android:';
  }
  return prefix;
}

function getAttrsName(key) {
  switch (key) {
    case 'width': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dWidth'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'width'
        : 'layout_width';
    }
    case 'height': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dHeight'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'height'
        : 'layout_height';
    }
    case 'orientation': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dOrientation'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'orientation'
        : 'orientation';
    }
    case 'marginLeft': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dMarginLeft'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'marginLeft'
        : 'layout_marginLeft';
    }
    case 'marginRight': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dMarginRight'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'marginRight'
        : 'layout_marginRight';
    }
    case 'marginTop': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dMarginTop'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'marginTop'
        : 'layout_marginTop';
    }
    case 'marginBottom': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dMarginBottom'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'marginBottom'
        : 'layout_marginBottom';
    }
    case 'backgroundColor': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dBackgroundColor'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'backgroundColor'
        : 'background';
    }
    case 'gravity': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dGravity'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'gravity'
        : 'layout_gravity';
    }
    case 'text': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dText'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'text'
        : 'text';
    }
    case 'textSize': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dTextSize'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'textSize'
        : 'textSize';
    }
    case 'textColor': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dTextColor'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'textColor'
        : 'textColor';
    }
    case 'lineBreakMode': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dLineBreakMode'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'lineBreakMode'
        : 'ellipsize';
    }
    case 'maxLines': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dMaxLines'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'maxLines'
        : 'maxLines';
    }
    case 'textGravity': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dTextGravity'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'textGravity'
        : 'gravity';
    }
    case 'imageUrl': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'hImageUrl'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'imageUrl'
        : 'src';
    }
    case 'borderWidth': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dBorderWidth'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'borderWidth'
        : 'borderWidth';
    }
    case 'borderColor': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dBorderColor'
        : targetDSLType == RULE_TYPE.RULE_3
        ? 'borderColor'
        : 'borderColor';
    }
    case 'cornerRadius': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dCornerRadius'
        : 'cornerRadius';
    }
    case 'cornerRadiusLeftTop': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dClipTopLeftRadius'
        : 'cornerRadiusLeftTop';
    }
    case 'cornerRadiusRightTop': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dClipTopRightRadius'
        : 'cornerRadiusRightTop';
    }
    case 'cornerRadiusLeftBottom': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dClipBottomLeftRadius'
        : 'cornerRadiusLeftBottom';
    }
    case 'cornerRadiusRightBottom': {
      return targetDSLType == RULE_TYPE.RULE_2
        ? 'dClipBottomRightRadius'
        : 'cornerRadiusRightBottom';
    }
  }
}

function getAttrsValue(key) {
  switch (key) {
    case 'match_parent': {
      return key;
    }
    case 'match_content': {
      return targetDSLType == RULE_TYPE.RULE_N ? 'wrap_content' : key;
    }
    case 'leftBottom': {
      return targetDSLType == RULE_TYPE.RULE_N ? 'left|bottom' : key;
    }
    case 'leftCenter': {
      return targetDSLType == RULE_TYPE.RULE_N ? 'left|center' : key;
    }
  }
}

/******************************************************
                      能效平台回调
 ******************************************************/
function traceViewXUseLog(http, querystring, efficiencyValue) {
  var requestData = {
    cardId: 24,
    cardName: 'viewx',
    times: 1,
    saveTimeSingle: efficiencyValue,
    recordDate: new Date().toJSON().substring(0, 10),
  };
  var content = querystring.stringify(requestData);
  var options = {
    hostname: 'mytest.alibaba-inc.com',
    path: '/efficiency/mybatis/addData?' + content,
    method: 'GET',
  };
  var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      // console.log('BODY: ' + chunk);
    });
  });
  req.on('error', function (e) {
    // console.log('problem with request: ' + e.message);
  });
  req.end();
}

function checkEfficiencyCalculation(resultGroup) {
  let totalCount = calculteWidgetsCount(resultGroup) + 1;
  // console.log('calculteWidgetsCount = ' + totalCount);
  let value = 0;
  if (totalCount <= 10) {
    value = 250;
  } else if (totalCount <= 20) {
    value = 500;
  } else if (totalCount <= 30) {
    value = 1000;
  } else {
    value = 2000;
  }
  return value * 0.7;
}

function calculteWidgetsCount(resultGroup) {
  let count = 0;
  if (resultGroup && resultGroup.children && resultGroup.children.length > 0) {
    resultGroup.children.forEach(function (child) {
      count++;
      if (isTypeGroup(child)) {
        count += calculteWidgetsCount(child);
      }
    });
  }
  return count;
}

/******************************************************
                      schema协议兼容 （针对 imgcook 平台的使用）
 ******************************************************/
function adapterSchemaProtocol(originData) {
  let { attrs, style } = originData.props;
  attrs = attrs || {};
  if (isValidValue(attrs.x)) {
    style.left = Math.max(0, attrs.x);
  }
  if (isValidValue(attrs.y)) {
    style.top = Math.max(0, attrs.y);
  }
  if (isValidValue(attrs.fixed)) {
    style.fixed = attrs.fixed;
  }
  if (isValidValue(attrs.lines)) {
    style.lines = attrs.lines;
  }
  if (originData.type === 'Text') {
    originData.type = 'div';
  }
  if (style.color) {
    style.color = transRGBAColor2HexWithOpacity(style.color, style.opacity);
  }
  if (style.backgroundColor) {
    style.backgroundColor = transRGBAColor2HexWithOpacity(
      style.backgroundColor,
      style.opacity
    );
  }
  if (style.borderColor) {
    style.borderColor = transRGBAColor2HexWithOpacity(style.borderColor);
  }
  if (attrs.source) {
    originData.props.src = attrs.source;
  }
  if (attrs.text) {
    originData.props.children = attrs.text;
    if (attrs.fixed) {
      originData.props.fixed = attrs.fixed;
    }
  }
  originData.props.style = style;
  if (originData.children && originData.children.length > 0) {
    originData.children.forEach((element) => {
      adapterSchemaProtocol(element);
    });
  }
  originData.props.attrs = {};
}
