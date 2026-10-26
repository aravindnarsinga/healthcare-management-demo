
pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Healthcare source code retrieved from GitHub.'
            }
        }

        stage('Validate') {
            steps {
                sh '''
                    set -eu
                    test -f app.js
                    test -f package.json
                    test -f package-lock.json
                    test -f public/index.html
                    test -f public/styles.css
                    echo "All required healthcare application files exist."
                '''
            }
        }

        stage('Install Dependencies and Test') {
            steps {
                sh '''
                    set -eu
                    npm ci
                    npm test
                    echo "Application validation passed."
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh '''
                    set -eu

                    rsync -a --delete \
                      --no-owner --no-group \
                      --exclude='.git/' \
                      --exclude='node_modules/' \
                      --exclude='.env' \
                      ./ /opt/healthcare-management-demo/

                    cd /opt/healthcare-management-demo
                    npm ci --omit=dev

                    sudo /usr/bin/systemctl restart healthcare-demo
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -eu

                    for i in 1 2 3 4 5 6 7 8 9 10; do
                      if curl -fsS \
                        http://127.0.0.1:3000/health; then
                        echo
                        echo "Healthcare website deployment verified."
                        exit 0
                      fi

                      sleep 2
                    done

                    echo "Health check failed."
                    sudo /usr/bin/systemctl status \
                      healthcare-demo --no-pager || true
                    exit 1
                '''
            }
        }
    }
}
