// 调试插件加载和命令注册
console.log('=== Halo Plugin Debug Script ===');

// 检查 logseq 对象是否存在
if (typeof logseq !== 'undefined') {
  console.log('✓ logseq 对象存在');
  
  // 检查 logseq.App 是否存在
  if (logseq.App) {
    console.log('✓ logseq.App 存在');
    
    // 检查 registerCommand 方法
    if (typeof logseq.App.registerCommand === 'function') {
      console.log('✓ logseq.App.registerCommand 方法存在');
      
      // 尝试注册一个测试命令
      try {
        logseq.App.registerCommand(
          'halo-debug-test',
          {
            key: 'halo-debug-test',
            label: '🔧 Halo Debug Test',
            desc: '测试命令注册是否正常工作',
            keybinding: {
              binding: 'mod+shift+t'
            }
          },
          () => {
            console.log('🎉 测试命令被触发！');
            if (logseq.UI && logseq.UI.showMsg) {
              logseq.UI.showMsg('Halo 插件命令注册正常！', 'success');
            } else {
              alert('Halo 插件命令注册正常！');
            }
          }
        );
        console.log('✓ 测试命令注册成功');
      } catch (error) {
        console.error('✗ 测试命令注册失败:', error);
      }
    } else {
      console.error('✗ logseq.App.registerCommand 方法不存在');
    }
  } else {
    console.error('✗ logseq.App 不存在');
  }
} else {
  console.error('✗ logseq 对象不存在');
}

// 检查是否有其他 halo 相关的命令已注册
setTimeout(() => {
  console.log('=== 检查已注册的命令 ===');
  // 这里我们无法直接访问已注册的命令列表，但可以通过其他方式检查
  console.log('请在 Logseq 中按 Cmd+Shift+P 打开命令面板，搜索 "halo" 查看是否有相关命令');
  console.log('或者尝试按 Cmd+Option+H 看是否触发发布命令');
  console.log('或者尝试按 Cmd+Shift+T 看是否触发这个测试命令');
}, 1000);