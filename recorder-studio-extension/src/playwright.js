

function generatePlaywrightCode(recordedActions, pageName = 'page') {
  console.log(`⚙️ Starting Playwright code generation for ${pageName}`);
  
  let code = "";
  
  recordedActions.forEach((action, index) => {
    console.log(`🔨 Processing action ${index + 1}/${recordedActions.length}:`, action);

    code += `// ${action.description}\n`;
    switch (action.type) {
      case 'click':
      code += `await ${pageName}.locator('xpath=${action.selector}').waitFor({ state: 'visible' });\n`;
      code += `await ${pageName}.locator('xpath=${action.selector}').click();\n\n`;
        break;
      case 'type':
        code += `await ${pageName}.locator('xpath=${action.selector}').waitFor({ state: 'visible' });\n`;
        // Check if this is for a contenteditable element
        if (action.description && action.description.includes('contenteditable')) {
          // For contenteditable elements, use evaluate to set innerHTML
          code += `await ${pageName}.locator('xpath=${action.selector}').evaluate(el => { el.innerHTML = '${action.value.replace(/'/g, "\\'")}'; });\n\n`;
        } else {
          // For regular inputs, use fill method
          code += `await ${pageName}.locator('xpath=${action.selector}').fill('${action.value}');\n\n`;
        }
        break;
      case 'select':
        code += `await ${pageName}.locator('xpath=${action.selector}').waitFor({ state: 'visible' });\n`;
        code += `await ${pageName}.locator('xpath=${action.selector}').selectOption('${action.value}');\n\n`;
        break;
      case 'assertion':
        code += `await expect(${pageName}.locator('xpath=${action.selector}')).toHaveText('${action.expectedText}');\n\n`;
        break;
      case 'color-assertion':
        code += `await expect(${pageName}.locator('xpath=${action.selector}')).toHaveCSS('color', '${action.expectedColor}');\n\n`;
        break;
      case 'background-color-assertion':
        if (action.description && action.description.includes('inherited')) {
          // Add a comment about the inherited background color
          code += `// Note: This element has a transparent background and inherits the background color from its parent\n`;
        }
        code += `await expect(${pageName}.locator('xpath=${action.selector}')).toHaveCSS('background-color', '${action.expectedBgColor}');\n\n`;
        break;
      case 'visible':
        code += `await expect(${pageName}.locator('xpath=${action.selector}')).toBeVisible();\n\n`;
        break;
      case 'comment':
        code += `// ${action.description}\n`;
        break;
      case 'wait':
        code += `// Active wait for ${action.duration} second${action.duration === 1 ? '' : 's'}\n`;
        code += `await ${pageName}.waitForTimeout(${action.duration * 1000});\n\n`;
        break;
    }
  });
  
  console.log('✅ Code generation complete');
  return code;
}