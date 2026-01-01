
import base64
import hashlib
import sys

def get_extension_id(key):
    try:
        # Decode the base64 key
        der = base64.b64decode(key)
        
        # Calculate SHA-256 digest
        sha256 = hashlib.sha256(der).hexdigest()
        
        # Take the first 32 characters (16 bytes)
        prefix = sha256[:32]
        
        # Convert hex to extension ID format (a-p)
        # 0-9 -> a-j, a-f -> k-p
        ext_id = ""
        for char in prefix:
            if '0' <= char <= '9':
                ext_id += chr(ord('a') + int(char))
            else:
                ext_id += chr(ord('a') + int(char, 16))
                
        return ext_id
    except Exception as e:
        return str(e)

key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhrVD7CDcpSScyKap8/eqO2LC7CbYucD8RmS/u/Iu1tKhDBvVmHnNtj/co6lGLPov/35Nx370HgSNWJcwAlk9qRTH9h+68QEGU3C4uO6os1YfkU/qoQuDgzyhrEFuawWN23M3I9A1u+hThDk59BnYaN4m/F8i1CX1PA66t45gf4RTKlQ/05msWj86vCTfiU3yB2VzfWslWO0RQr9OUTxyveCeGPoa2QuC14LbnOnmEJ1/XsqbZr2wsdQjGVD1vCxfzJWz+ScjVvu/TstKtzK9delfPSdS1FolFbI0y60a2P5iiWqqCOm7Dz1pEQEK5j4dycKH0FYp/s2ZRsQ1Pkvt1QIDAQAB"

calculated_id = get_extension_id(key)
expected_id = "donmkahapkohncialmknoofangooemjb"

print(f"Calculated ID: {calculated_id}")
print(f"Expected ID:   {expected_id}")
print(f"Match:         {calculated_id == expected_id}")
