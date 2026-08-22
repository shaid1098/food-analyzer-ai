async function testEndpoint(foodName) {
  console.log(`\n==================================================`);
  console.log(`TESTING: "${foodName}"`);
  console.log(`==================================================`);

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="foodName"',
    '',
    foodName,
    `--${boundary}`,
    'Content-Disposition: form-data; name="goal"',
    '',
    'GENERAL_HEALTHY_EATING',
    `--${boundary}--`,
    ''
  ].join('\r\n');

  try {
    const res = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Error status ${res.status}:`, text);
      return;
    }

    const data = await res.json();
    console.log(`Status: ${data.status}`);
    if (data.identification) {
      console.log(`Identification: ${data.identification.food_name} (${Math.round(data.identification.confidence_score * 100)}% confidence)`);
    } else {
      console.log(`Identification: none`);
    }
    if (data.nutrition) {
      console.log(`Nutrition matches: "${data.nutrition.food_name}"`);
      console.log(`Calories: ${data.nutrition.calories} kcal`);
      console.log(`Protein: ${data.nutrition.protein}g`);
      console.log(`Carbs: ${data.nutrition.carbohydrates}g`);
      console.log(`Fat: ${data.nutrition.fat}g`);
      console.log(`Source: ${data.nutrition.source}`);
    } else {
      console.log(`Nutrition: UNAVAILABLE`);
    }
    if (data.explanation) {
      console.log(`Explanation summary: "${data.explanation.summary}"`);
      console.log(`Goal alignment: "${data.explanation.goal_alignment}"`);
    } else {
      console.log(`Explanation: none`);
    }
    if (data.errors && data.errors.length > 0) {
      console.log('Errors:', data.errors);
    }
  } catch (error) {
    console.error('Test run failed:', error.message);
  }
}

async function runAll() {
  await testEndpoint('Ramen');
  await testEndpoint('Falafel');
  await testEndpoint('Keyboard');
}

runAll();
