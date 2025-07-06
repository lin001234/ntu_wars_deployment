# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "Dockerized_service"
  location = "West Europe"
}

# Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-dev-myproject"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

# Subnet
resource "azurerm_subnet" "internal" {
  name                 = "snet-internal"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Public ip_configuration
resource "azurerm_public_ip" "pub_ip" {
  name                = "VM-publicIP"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"

  tags = {
    environment = "Production"
  }
}

# Network Interface
resource "azurerm_network_interface" "nic_vm1" {
  name                = "nic-vm1"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "ipconfig-internal"
    subnet_id                     = azurerm_subnet.internal.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pub_ip.id
  }
}

# Network security
resource "azurerm_network_security_group" "VM_nsg" {
  name                = "VM_nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "test123"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAnyCustom3000Inbound"
    priority                   = 1020
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  tags = {
    environment = "Production"
  }
}

# Association of NSG to VM
resource "azurerm_network_interface_security_group_association" "NSG_association" {
  network_interface_id      = azurerm_network_interface.nic_vm1.id
  network_security_group_id = azurerm_network_security_group.VM_nsg.id
}

# Linux VM
resource "azurerm_linux_virtual_machine" "vm1" {
  name                = "vm1-dev-myproject"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = "Standard_B1s"
  admin_username      = "azureuser"
  network_interface_ids = [
    azurerm_network_interface.nic_vm1.id,
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file("/home/khant/.ssh/vm.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
}

resource "local_file" "inventory_yml" {
    content = templatefile("inventory.yml.tpl",{
        instance_name   = azurerm_linux_virtual_machine.vm1.name
        instance_ip     = azurerm_public_ip.pub_ip.ip_address 
        instance_key    = "/home/khant/.ssh/vm.pem"
        ansible_user    = "azureuser"

    })

    filename = "inventory.yml"
}