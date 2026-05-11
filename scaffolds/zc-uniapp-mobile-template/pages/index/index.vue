<template>
  <s-layout 
    title="首页"
    tabbar="/pages/index/index"
    navbar="inner"
    :bgStyle="template.page"
    :navbarStyle="template.navigationBar"
    onShareAppMessage>
    <view v-for="(item,index) in gridData" :key="index">
      <view v-if="item?.children && item?.children?.length > 0">
        <view style="padding-left: 10px;">{{item.label}}</view>
        <wd-grid clickable :column="2" :gutter="10">
          <template v-for="(subItem,index) in item.children" :key="index">
            <wd-grid-item :text="subItem.label" @itemclick="handleClick(subItem)">
            </wd-grid-item>
          </template>
        </wd-grid>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
	import { computed, ref } from 'vue';
	import { onLoad, onShow } from '@dcloudio/uni-app';
	import sheep from '@/sheep';
	import Api from "@/sheep/api/system/api"
  import { getComponentByPageName } from "@/sheep/util/businessPageMap"
	// 隐藏原生tabBar
	uni.hideTabBar();
	const template = computed(() => sheep.$store('app').template?.home);
  const listData = ref([])
  const gridData = ref([])
  const isFirstLoad = ref(false);  //首次加载标识（默认false）
  const formatContinuousMenu = (originArr) => {
    const result = [];
    let currentContainer = null;
    originArr.forEach(item => {
      const hasValidChildren = item.children && Array.isArray(item.children) && item.children.length > 0;

      if (hasValidChildren) {
        // 有children：先加容器（若有），再加当前对象
        if (currentContainer) {
          result.push(currentContainer);
          currentContainer = null;
        }
        result.push(item);
      } else {
        // 无children：追加到容器（无则新建）
        if (!currentContainer) {
          currentContainer = { label: "", children: [] };
        }
        currentContainer.children.push(item);
      }
    });

    // 兜底：加入最后一个容器
    if (currentContainer) {
      result.push(currentContainer);
    }

    return result;
  }

  // 宫格点击事件（根据item类型处理）
  const handleClick = (item) => {
    const url = '/pages/container/container?pageName='+item.component+'&pageCode='+item.pageCode
    uni.navigateTo({ url: url });
  }

  /**
   * 处理菜单数组，仅保留一层children，多层嵌套时合并label（用/连接）
   */
  function flattenMenuChildren(menuArr) {
    // 内部递归函数：提取所有深层节点，返回平级节点数组（带合并label）
    function flattenNodes(nodes, parentLabel = '') {
      let result = [];
      nodes.forEach(node => {
        // 拼接当前节点label（父label + 自身label，根节点无父label）
        const currentLabel = parentLabel ? `${parentLabel}/${node.label}` : node.label;
        // 复制节点，替换label为合并后的结果，避免修改原数据
        const newNode = { ...node, label: currentLabel };
        
        // 若当前节点有children，递归提取子节点；若无，直接加入结果
        if (node.children && node.children.length > 0) {
          // 递归处理子节点，传入当前合并label作为父label
          const childNodes = flattenNodes(node.children, currentLabel);
          result = [...result, ...childNodes];
          // 移除当前节点自身的children和unfolded（避免保留多层结构）
          delete newNode.children;
          delete newNode.unfolded;
        } else {
          result.push(newNode);
        }
      });
      return result;
    }

    // 处理顶层菜单节点，仅保留一层children
    return menuArr.map(topNode => {
      const newTopNode = { ...topNode }; // 复制顶层节点，不修改原数据
      if (topNode.children && topNode.children.length > 0) {
        newTopNode.children = flattenNodes(topNode.children);
        newTopNode.unfolded = true;
      }
      return newTopNode;
    });
  }

  //过滤接口的数据,只要移动端类型的数据
  const filterMenuByTerminal = (data) => {
    return data.reduce((res, item) => {
      // 深拷贝当前项，完全保留原始结构（避免修改原数据）
      const newItem = { ...item };
      // 1. 处理子节点：如果有children，递归过滤子节点
      if (newItem.children && newItem.children.length) {
        newItem.children = filterMenuByTerminal(newItem.children);
      }
      // 2. 筛选规则：当前节点符合条件 ✅ OR 有符合条件的子节点 ✅，则保留
      if (item.pageTerminal === '2' || (newItem.children && newItem.children.length > 0)) {
        res.push(newItem);
      }
      return res;
    }, []);
  }

  //将接口返回的页面动态导入进来
  const dynamicImport = (appData) => {
    for (const item of appData) {
      if(item.children?.length > 0) {
        dynamicImport(item.children)
      } else {
        getComponentByPageName(item.component);
      }
    }
  }
	onLoad(async() => {
    if(uni.getStorageSync('portalVal')) { // 有门户时
      const portalKey = uni.getStorageSync('portalVal')
      const page = await Api.getPortalDynamicPage(portalKey)
      listData.value = page.data.navigation
    } else { // 没有门户时直接取页面管理的动态页面
      const page = await Api.getDynamicPage()
      const data = page?.data?.links[0].children
      const appData = filterMenuByTerminal(data)
      listData.value = flattenMenuChildren(appData)
      dynamicImport(appData)
    }
    isFirstLoad.value = true
    gridData.value = formatContinuousMenu(listData.value);
	});

  onShow(async () =>{
    if(isFirstLoad.value) {
      if(uni.getStorageSync('portalVal')) {
        const portalKey = uni.getStorageSync('portalVal')
        const page = await Api.getPortalDynamicPage(portalKey)
        if (page.msg.indexOf('该门户不存在！') >-1){
          uni.removeStorageSync('portalVal')
          const page = await Api.getDynamicPage()
          const data = page?.data?.links[0].children
          const appData = filterMenuByTerminal(data)
          dynamicImport(appData)
          listData.value = flattenMenuChildren(appData)
          return;
        }
        listData.value = page.data.navigation
      } else { // 否则直接取页面管理的动态页面
        const page = await Api.getDynamicPage()
        const data = page?.data?.links[0].children
        const appData = filterMenuByTerminal(data)
        dynamicImport(appData)
        listData.value = flattenMenuChildren(appData)
      }
      gridData.value = formatContinuousMenu(listData.value);
    }
  })
</script>

<style lang="scss" scoped>
:deep(.wd-grid-item__text){
  line-height:16px;
}
</style>
