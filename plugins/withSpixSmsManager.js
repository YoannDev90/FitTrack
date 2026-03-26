const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function getAndroidPackage(config) {
  return config.android?.package;
}

function createModuleSource(androidPackage) {
  return `package ${androidPackage}

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SpixSmsSenderModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SpixSmsSender"

  @ReactMethod
  fun hasSmsPermission(promise: Promise) {
    promise.resolve(isSmsPermissionGranted())
  }

  @ReactMethod
  fun sendSmsDirect(phone: String, message: String, promise: Promise) {
    if (phone.isBlank() || message.isBlank()) {
      promise.reject("E_INVALID_ARGUMENT", "Phone and message are required.")
      return
    }

    if (!isSmsPermissionGranted()) {
      promise.reject("E_PERMISSION_DENIED", "SEND_SMS permission not granted.")
      return
    }

    if (!reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY_MESSAGING)) {
      promise.reject("E_UNSUPPORTED", "Device does not support telephony messaging.")
      return
    }

    try {
      val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        reactContext.getSystemService(SmsManager::class.java)
      } else {
        @Suppress("DEPRECATION")
        SmsManager.getDefault()
      }

      if (smsManager == null) {
        promise.reject("E_SMS_MANAGER", "SmsManager is not available.")
        return
      }

      val parts = smsManager.divideMessage(message)
      if (parts.size > 1) {
        smsManager.sendMultipartTextMessage(phone, null, parts, null, null)
      } else {
        smsManager.sendTextMessage(phone, null, message, null, null)
      }

      promise.resolve(true)
    } catch (securityException: SecurityException) {
      promise.reject("E_PERMISSION_DENIED", "SEND_SMS permission not granted.", securityException)
    } catch (error: Throwable) {
      promise.reject("E_SEND_FAILED", "Failed to send SMS.", error)
    }
  }

  private fun isSmsPermissionGranted(): Boolean {
    return ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.SEND_SMS
    ) == PackageManager.PERMISSION_GRANTED
  }
}
`;
}

function createPackageSource(androidPackage) {
  return `package ${androidPackage}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SpixSmsSenderPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(SpixSmsSenderModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
`;
}

function withSpixSmsManagerFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidPackage = getAndroidPackage(config);
      if (!androidPackage) {
        throw new Error('[withSpixSmsManager] Missing android.package in Expo config.');
      }

      const packagePath = androidPackage.split('.').join(path.sep);
      const javaDir = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packagePath
      );

      fs.mkdirSync(javaDir, { recursive: true });

      const moduleFilePath = path.join(javaDir, 'SpixSmsSenderModule.kt');
      const packageFilePath = path.join(javaDir, 'SpixSmsSenderPackage.kt');

      fs.writeFileSync(moduleFilePath, createModuleSource(androidPackage));
      fs.writeFileSync(packageFilePath, createPackageSource(androidPackage));

      return config;
    },
  ]);
}

function withSpixSmsManagerMainApplication(config) {
  return withMainApplication(config, (config) => {
    const registrationLine = '          add(SpixSmsSenderPackage())';
    let contents = config.modResults.contents;

    if (!contents.includes('add(SpixSmsSenderPackage())')) {
      if (contents.includes('// add(MyReactNativePackage())')) {
        contents = contents.replace(
          '// add(MyReactNativePackage())',
          `// add(MyReactNativePackage())\n${registrationLine}`
        );
      } else {
        const applyRegex = /PackageList\(this\)\.packages\.apply\s*\{/;
        if (!applyRegex.test(contents)) {
          throw new Error('[withSpixSmsManager] Unable to find PackageList(this).packages.apply block in MainApplication.');
        }
        contents = contents.replace(applyRegex, (match) => `${match}\n${registrationLine}`);
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

const withSpixSmsManager = (config) => {
  config = withSpixSmsManagerFiles(config);
  config = withSpixSmsManagerMainApplication(config);
  return config;
};

module.exports = withSpixSmsManager;
