pipeline {
  agent any
  stages {
    stage('Checkout Code') {
      steps {
        git(url: 'https://github.com/athamour1/my-blog', branch: 'main')
      }
    }

    stage('Log') {
      steps {
        sh 'ls -al '
      }
    }

  }
}