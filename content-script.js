// content-script.js
(function() {
  // Check for reCAPTCHA
  if (document.querySelector('iframe[src*="recaptcha"]') || 
      document.querySelector('div.g-recaptcha')) {
    chrome.runtime.sendMessage({
      type: 'formResult',
      data: {
        status: 'SKIPPED-reCAPTCHA',
        reason: 'reCAPTCHA detected'
      }
    });
    return;
  }

  // Find contact forms
  const formSelectors = [
    'form[id*="contact"]',
    'form[id*="inquiry"]',
    'form[id*="問合"]',
    'form[id*="contact"]',
    'form[action*="contact"]',
    'form[action*="inquiry"]'
  ];

  const forms = [];
  formSelectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    found.forEach(form => forms.push(form));
  });

  if (forms.length === 0) {
    chrome.runtime.sendMessage({
      type: 'formResult',
      data: {
        status: 'NOFORM',
        reason: 'No contact form found'
      }
    });
    return;
  }

  // Prepare message data
  const message = {
    name: 'MEO改善サービス',
    email: 'support@meo-service.example.com',
    phone: '03-1234-5678',
    message: `貴店のGoogleマップ評価を改善するサービスを提供しております。
現在の評価を分析し、適切な対策をご提案できます。
詳細についてご興味がございましたら、ぜひご連絡ください。

【送信元情報】
MEO改善サポートチーム
電話: 03-1234-5678
メール: support@meo-service.example.com
配信停止希望の場合: 返信メールにて「配信停止」とご連絡ください`
  };

  // Try to fill and submit forms
  let submitted = false;
  
  forms.forEach(form => {
    if (submitted) return;
    
    try {
      // Simple form filling logic - would need to be more sophisticated
      const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
      
      inputs.forEach(input => {
        const name = input.name.toLowerCase();
        if (name.includes('name')) {
          input.value = message.name;
        } else if (name.includes('mail')) {
          input.value = message.email;
        } else if (name.includes('tel') || name.includes('phone')) {
          input.value = message.phone;
        } else if (name.includes('message') || name.includes('inquiry')) {
          input.value = message.message;
        }
      });
      
      form.submit();
      submitted = true;
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  if (submitted) {
    chrome.runtime.sendMessage({
      type: 'formResult',
      data: {
        status: 'SENT',
        reason: 'Form submitted successfully'
      }
    });
  } else {
    chrome.runtime.sendMessage({
      type: 'formResult',
      data: {
        status: 'ERROR',
        reason: 'Failed to submit form'
      }
    });
  }
})();