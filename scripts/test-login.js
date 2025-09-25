async function testLogin() {
  const email = 'admin@vownow.com';
  const password = 'Admin123!@#';

  console.log('Testing login with:');
  console.log('Email:', email);
  console.log('Password:', password);

  try {
    const response = await fetch('http://localhost:3001/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('You can now access the admin dashboard at http://localhost:3001/admin');
    } else {
      console.log('\n❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
}

testLogin();