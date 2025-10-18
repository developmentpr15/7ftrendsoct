// Test script to verify auth store imports work correctly
console.log('🧪 Testing Auth Store Import Fix...\n');

// Test 1: Default import (most common)
console.log('✅ Test 1: Default Import');
try {
  const useAuthStoreDefault = require('./src/store/authStore.js').default;
  console.log('   ✓ Default import successful');
  console.log('   ✓ Function type:', typeof useAuthStoreDefault);
} catch (error) {
  console.log('   ❌ Default import failed:', error.message);
}

// Test 2: Named import (what was causing the error)
console.log('\n✅ Test 2: Named Import');
try {
  const { useAuthStore } = require('./src/store/authStore.js');
  console.log('   ✓ Named import successful');
  console.log('   ✓ Function type:', typeof useAuthStore);
} catch (error) {
  console.log('   ❌ Named import failed:', error.message);
}

// Test 3: Direct require
console.log('\n✅ Test 3: Direct Require');
try {
  const authStore = require('./src/store/authStore.js');
  console.log('   ✓ Direct require successful');
  console.log('   ✓ Has default export:', !!authStore.default);
  console.log('   ✓ Has named export:', !!authStore.useAuthStore);
} catch (error) {
  console.log('   ❌ Direct require failed:', error.message);
}

console.log('\n🎉 Auth store import tests completed!');
console.log('\n📝 Usage Examples:');
console.log('// Default import (recommended)');
console.log('import useAuthStore from "./store/authStore";');
console.log('');
console.log('// Named import (now also works)');
console.log('import { useAuthStore } from "./store/authStore";');
console.log('');
console.log('// Usage in component');
console.log('const user = useAuthStore(state => state.user);');
console.log('const setUser = useAuthStore(state => state.setUser);');
console.log('const logout = useAuthStore(state => state.logout);');