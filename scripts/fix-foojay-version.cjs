const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts'
);

const drawerNativeFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-drawer-layout',
  'lib',
  'module',
  'views',
  'Drawer.native.js'
);

function patchDrawerSpring() {
  if (!fs.existsSync(drawerNativeFile)) {
    console.log('[fix-drawer] Target file not found, skipping:', drawerNativeFile);
    return;
  }

  const content = fs.readFileSync(drawerNativeFile, 'utf8');
  const originalSpringBlock = `    translationX.value = withSpring(translateX, {\n      velocity,\n      stiffness: 1000,\n      damping: 500,\n      mass: 3,\n      overshootClamping: true,\n      restDisplacementThreshold: 0.01,\n      restSpeedThreshold: 0.01,\n      reduceMotion: ReduceMotion.Never\n    }, finished => runOnJS(onAnimationEnd)(open, finished));`;

  const previousPatchedBlock = `    const easedVelocity = velocity == null ? undefined : Math.max(Math.min(velocity * 0.22, 420), -420);\n    translationX.value = withSpring(translateX, {\n      velocity: easedVelocity,\n      stiffness: 460,\n      damping: 88,\n      mass: 1.35,\n      overshootClamping: true,\n      restDisplacementThreshold: 0.2,\n      restSpeedThreshold: 0.2,\n      reduceMotion: ReduceMotion.Never\n    }, finished => runOnJS(onAnimationEnd)(open, finished));`;

  const previousFastProfileBlock = `    const easedVelocity = velocity == null ? undefined : Math.max(Math.min(velocity * 0.4, 900), -900);\n    translationX.value = withSpring(translateX, {\n      velocity: easedVelocity,\n      stiffness: 720,\n      damping: 98,\n      mass: 1.08,\n      overshootClamping: true,\n      restDisplacementThreshold: 0.15,\n      restSpeedThreshold: 0.15,\n      reduceMotion: ReduceMotion.Never\n    }, finished => runOnJS(onAnimationEnd)(open, finished));`;

  const targetSpringBlock = `    const isAndroid = Platform.OS === 'android';\n    const velocityScale = isAndroid ? 0.3 : 0.4;\n    const velocityCap = isAndroid ? 620 : 900;\n    const easedVelocity = velocity == null ? undefined : Math.max(Math.min(velocity * velocityScale, velocityCap), -velocityCap);\n    translationX.value = withSpring(translateX, {\n      velocity: easedVelocity,\n      stiffness: isAndroid ? 640 : 720,\n      damping: isAndroid ? 92 : 98,\n      mass: isAndroid ? 0.98 : 1.08,\n      overshootClamping: true,\n      restDisplacementThreshold: isAndroid ? 0.28 : 0.15,\n      restSpeedThreshold: isAndroid ? 0.28 : 0.15,\n      reduceMotion: ReduceMotion.Never\n    }, finished => runOnJS(onAnimationEnd)(open, finished));`;

  if (content.includes(targetSpringBlock)) {
    console.log('[fix-drawer] Already patched with latest profile.');
    return;
  }

  let patched = content;
  if (patched.includes(previousPatchedBlock)) {
    patched = patched.replace(previousPatchedBlock, targetSpringBlock);
  } else if (patched.includes(previousFastProfileBlock)) {
    patched = patched.replace(previousFastProfileBlock, targetSpringBlock);
  } else if (patched.includes(originalSpringBlock)) {
    patched = patched.replace(originalSpringBlock, targetSpringBlock);
  } else {
    console.log('[fix-drawer] Expected spring block not found, skipping.');
    return;
  }

  fs.writeFileSync(drawerNativeFile, patched, 'utf8');
  console.log('[fix-drawer] Patched drawer spring and velocity for faster smooth opening.');
}

function run() {
  if (!fs.existsSync(targetFile)) {
    console.log('[fix-foojay] Target file not found, skipping:', targetFile);
    patchDrawerSpring();
    return;
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const oldValue = 'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")';
  const newValue = 'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")';

  if (content.includes(newValue)) {
    console.log('[fix-foojay] Already patched.');
    patchDrawerSpring();
    return;
  }

  if (!content.includes(oldValue)) {
    console.log('[fix-foojay] Expected pattern not found, skipping.');
    patchDrawerSpring();
    return;
  }

  const patched = content.replace(oldValue, newValue);
  fs.writeFileSync(targetFile, patched, 'utf8');
  console.log('[fix-foojay] Patched foojay resolver convention plugin to 1.0.0');

  patchDrawerSpring();
}

run();
