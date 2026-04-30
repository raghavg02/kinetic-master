import subprocess
import sys

def run_command(command):
    print(f"Running: {command}")
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        print(line, end="")
    process.wait()
    return process.returncode

def main():
    print("Fixing ML Backend environment...")
    
    # Uninstall problematic packages
    run_command(f"{sys.executable} -m pip uninstall -y tensorflow tensorflow-cpu tensorflow-intel keras")
    
    # Install specific versions known to work together
    # For Python 3.12, 2.16+ is needed
    run_command(f"{sys.executable} -m pip install tensorflow==2.16.1")
    
    # Check if it works
    print("\nVerifying installation...")
    run_command(f"{sys.executable} -c \"import tensorflow as tf; print('TF Version:', tf.__version__); from tensorflow import keras; print('Keras imported successfully')\"")

if __name__ == "__main__":
    main()
