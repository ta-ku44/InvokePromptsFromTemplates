const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | HTMLDivElement;
  const text = target.textContent || (target as HTMLTextAreaElement).value || '';

  console.log('User input:', text);
  const match = text.match(/;;(\w+)$/);
  if (match) {
    const command = match[1];
    console.log(';;を検出:', command);
    // TODO: コマンドに基づく処理を実装
  }
}

const findTextAreas = (): HTMLTextAreaElement | null => {
  // TODO: サイトのセレクタを追加
  return null;
}

const init = () => {
  console.log('PromptTemplateを初期化:',window.location.href);

  const checkInterval = setInterval(() => {
    const textAreas = findTextAreas();{
      if (textAreas) {
        console.log('テキストエリアを検出');

        textAreas.addEventListener('input', handleInput);
        clearInterval(checkInterval);
      }
    }
  }, 1000);

  setTimeout(() => clearInterval(checkInterval), 10000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}