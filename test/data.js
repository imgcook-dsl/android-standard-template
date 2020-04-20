module.exports = {
  componentName: 'Page',
  id: 'Shape_0',
  rect: { x: 0, y: 0, width: 750, height: 635 },
  smart: {},
  props: {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#f2f2f2',
      width: '750px',
      height: '635px'
    },
    className: 'box'
  },
  children: [
    {
      componentName: 'Text',
      id: 'Text_2',
      rect: { x: 31, y: 40, width: 318, height: 33 },
      smart: {},
      props: {
        style: {
          marginLeft: '31px',
          width: '318px',
          maxWidth: '707px',
          height: '33px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '33px',
          letterSpacing: '0.11px',
          whiteSpace: 'pre',
          color: '#000000',
          fontSize: '24px',
          fontWeight: 500
        },
        text: 'Hello, DSL plugin developer',
        className: 'bd'
      }
    },
    {
      componentName: 'Div',
      id: 'Block_626614',
      rect: { x: 0, y: 100, width: 749, height: 490 },
      smart: {},
      props: {
        style: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: '27px',
          width: '749px'
        },
        className: 'ft'
      },
      children: [
        {
          componentName: 'Div',
          id: 'Shape_1',
          rect: { x: 31, y: 100, width: 689, height: 490 },
          smart: {},
          props: {
            style: {
              display: 'flex',
              alignItems: 'flex-start',
              flexDirection: 'column',
              borderRadius: '12px',
              backgroundColor: 'rgba(232,195,148,0.82)',
              width: '689px',
              height: '490px'
            },
            className: 'outer'
          },
          children: [
            {
              componentName: 'Text',
              id: 'Text_6',
              rect: { x: 59, y: 128, width: 93, height: 30 },
              smart: {},
              props: {
                style: {
                  marginTop: '28px',
                  marginLeft: '28px',
                  width: '93px',
                  maxWidth: '649px',
                  height: '30px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '30px',
                  letterSpacing: '0.08px',
                  whiteSpace: 'pre',
                  color: '#4d4d4d',
                  fontSize: '22px',
                  fontWeight: 500
                },
                text: 'Get start',
                className: 'getStart'
              }
            },
            {
              componentName: 'Text',
              id: 'Text_7',
              rect: { x: 59, y: 176, width: 389, height: 30 },
              smart: {},
              props: {
                style: {
                  marginTop: '18px',
                  marginLeft: '28px',
                  width: '389px',
                  maxWidth: '649px',
                  height: '30px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '30px',
                  letterSpacing: '0.08px',
                  whiteSpace: 'pre',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 500
                },
                text: 'How to develop your own dsl plugin?',
                className: 'title'
              }
            },
            {
              componentName: 'Div',
              id: 'Block_528315',
              rect: { x: 31, y: 242, width: 688, height: 207 },
              smart: {},
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: '36px',
                  width: '688px'
                },
                className: 'itemWrap'
              },
              children: [
                {
                  componentName: 'Image',
                  id: 'Image_4',
                  rect: { x: 265, y: 242, width: 220, height: 207 },
                  smart: {},
                  props: {
                    style: { width: '220px', height: '207px' },
                    src:
                      'https://gw.alicdn.com/tfs/TB1QbFSqi_1gK0jSZFqXXcpaXXa-440-414.png',
                    className: 'item'
                  }
                }
              ]
            },
            {
              componentName: 'Div',
              id: 'Shape_3',
              rect: { x: 618, y: 538, width: 80, height: 30 },
              smart: {},
              props: {
                style: {
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'row',
                  marginTop: '89px',
                  marginLeft: '587px',
                  borderRadius: '15px',
                  backgroundColor: '#eeeeee',
                  paddingRight: '28px',
                  paddingLeft: '28px',
                  height: '30px'
                },
                className: 'tryWrap'
              },
              children: [
                {
                  componentName: 'Text',
                  id: 'Text_5',
                  rect: { x: 646, y: 542, width: 25, height: 22 },
                  smart: {},
                  props: {
                    style: {
                      width: '25px',
                      height: '22px',
                      lineHeight: '22px',
                      letterSpacing: '0.07px',
                      whiteSpace: 'nowrap',
                      color: '#b38765',
                      fontSize: '16px',
                      fontWeight: 500
                    },
                    text: 'Try',
                    className: 'try'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  fileName: 'index'
};
