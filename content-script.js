const port = chrome.runtime.connect({ name: "form-submitter" });

// Check for reCAPTCHA
function hasRecaptcha() {
  return document.querySelector('iframe[src*="recaptcha"]') !== null ||
         document.querySelector('div.g-recaptcha') !== null;
}

// Find contact forms
function findContactForms() {
  const possibleSelectors = [
    'form[action*="contact"]',
    'form[action*="inquiry"]',
    'form[action*="問い合わせ"]',
    'form[action*="問合せ"]',
    'form[action*="お問い合わせ"]',
    'form[id*="contact"]',
    'form[id*="inquiry"]',
    'form[id*="問い合わせ"]',
    'form[id*="問合せ"]',
    'form[id*="お問い合わせ"]'
  ];
  
  return Array.from(document.querySelectorAll(possibleSelectors.join(',')));
}

// Fill and submit form
function submitForm(form, businessName, mapUrl, sheetId) {
  const textareas = form.querySelectorAll('textarea');
  const inputs = form.querySelectorAll('input[type="text"], input[type="email"]');
  
  // Default message
  const message = `突然のご連絡失礼いたします。
当社 日本MEOエキスパート組合 は、Googleローカルガイド Lv.8 以上（上位 0.2 %）だけを厳選したネットワークを運営し、ローカルガイドによるレビューを即日で獲得して集客に繋げるMEO強化サービスを提供しております。

▼サービス３つの特徴
・ルート検索 +531% / 検索 +745%(実例) 大幅なKPI向上。
・KPI向上による売上331%上昇。
・Googleポリシー及び景表法準拠。

いまなら期間限定 4,500 円（税込）〜／1レビュー でご提供中です（通常 10,000 円）。安心安全なクラウドソーシングサイトで今すぐ購入できます↓↓↓。
https://coconala.com/services/3689434

「駅周辺で競合が増え、検索順位が下がった」
「Instagramやチラシより“来店に直結する施策”を探している」
そんなお悩みがあれば、ぜひ一度サービスだけでもご覧ください。

--
三浦 順一
〒150-0002 東京都渋谷区渋谷2-19-15宮益坂ビルディング
info@meo-expert.jp
070-8484-9752
配信停止希望の場合、お手数ですが本メールにご返信ください`;

  // Try to fill form fields
  try {
    // Fill textareas (likely message fields)
    textareas.forEach(textarea => {
      if (textarea.value === '') {
        textarea.value = message;
      }
    });
    
    // Fill inputs
    inputs.forEach(input => {
      const name = input.name.toLowerCase();
      const id = input.id.toLowerCase();
      
      if (name.includes('name') || id.includes('name')) {
        input.value = '三浦 順一';
      } else if (name.includes('mail') || id.includes('mail')) {
        input.value = 'info@meo-expert.jp';
      } else if (name.includes('tel') || id.includes('tel')) {
        input.value = '070-8484-9752';
      } else if (name.includes('subject') || id.includes('subject')) {
        input.value = 'ローカルガイドの口コミ獲得支援について';
      }
    });
    
    // Submit form
    form.submit();
    
    // Wait a bit to ensure submission
    setTimeout(() => {
      port.postMessage({
        type: 'formResult',
        businessName,
        mapUrl,
        status: 'SENT'
      });
    }, 2000);
    
    return true;
  } catch (error) {
    port.postMessage({
      type: 'formResult',
      businessName,
      mapUrl,
      sheetId,
      status: 'ERROR'
    });
    return false;
  }
}

// Main execution
function main() {
  const params = new URLSearchParams(window.location.search);
  const businessName = params.get('businessName');
  const mapUrl = params.get('mapUrl');
  const sheetId = params.get('sheetId');
  
  if (hasRecaptcha()) {
    port.postMessage({
      type: 'formResult',
      businessName,
      mapUrl,
      sheetId,
      status: 'SKIPPED-reCAPTCHA'
    });
    return;
  }
  
  const forms = findContactForms();
  if (forms.length === 0) {
    port.postMessage({
      type: 'formResult',
      businessName,
      mapUrl,
      sheetId,
      status: 'NOFORM'
    });
    return;
  }
  
  // Try to submit the first found form
  submitForm(forms[0], businessName, mapUrl, sheetId);
}

// Run the script
main();