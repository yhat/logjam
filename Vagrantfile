# -*- mode: ruby -*-
# vi: set ft=ruby :
# vagrant package
# s3cmd put -P package.box s3://yhat-build-dev/boxes/vagrant/scienceops/3.9.0/package.box

BOX_NAME = ENV['BOX_NAME'] || "tailor-box"
VAGRANTFILE_API_VERSION = "2"
Vagrant.require_version ">= 1.5.0"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # Setup virtual machine box. This VM configuration code is always executed.
  config.vm.box = BOX_NAME
  # config.vm.box = "ubuntu/trusty64"
  config.vm.box = "jess/ubuntu-yhat-essentials"
  config.vm.box_check_update = true

  config.vm.provision :shell, :inline => "/tailor/provision/system"

  config.vm.provider :virtualbox do |vb|
    vb.name = BOX_NAME
    vb.customize ["modifyvm", :id, "--cpus", 4]
    vb.customize ["modifyvm", :id, "--memory", 4096]
    vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end


  config.vm.synced_folder ".", "/tailor"
  config.vm.network "forwarded_port", guest: 3000, host: 3000, auto_correct: true
end
