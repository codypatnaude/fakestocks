function viewModel(){
  let self = this
  self.firstName = ko.observable("Bob")
  self.lastName = ko.observable("Boberino")

  self.nameObj = ko.observable({firstName:"Sara", lastName:"Fortin"})
}
