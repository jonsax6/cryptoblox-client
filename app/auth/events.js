'use strict'
const getFormFields = require('../../lib/get-form-fields')
const store = require('../store')
const api = require('./api')
const ui = require('./ui')
const actions = require('./actions')

const onSignUp = (event) => {
  event.preventDefault()

  // get information from event and form
  const form = event.target
  const data = getFormFields(form)

  // make an API call using ajax
  api.signUp(data)
    .then(ui.onSignUpSuccess)
    .catch(ui.onSignUpFailure)
}

const onSignIn = (event) => {
	event.preventDefault()
	const form = event.target
	const data = getFormFields(form)
	api.signIn(data)
    .then(ui.onSignInSuccess)
    .catch(ui.onSignInFailure)
}

const onSignOut = (event) => {
	event.preventDefault()
	api.signOut()
    .then(ui.onSignOutSuccess)
    .catch(ui.onFailure)
}

const onTransactionSubmit = (event) => {
	event.preventDefault()
  // console.log(event)
	const form = event.target
	const data = getFormFields(form)
  console.log(data)
	api.transaction(data)
    .then(ui.onTransactionSuccess)
    .catch(ui.onTransactionFailure)
}

const onTransactionEditSubmit = (event) => {
  event.preventDefault()
  const form = event.target
  const data = getFormFields(form)
  data.transaction.id = store.editTxId
  api.editTransaction(data)
    .then(ui.onEditTransactionSuccess)
    .then(ui.onTransactionFailure)
}


//-----------------------------------------//
const onTransactionEditModal = (event) => {
	event.preventDefault()
  $('#editTransactionModalLabel').text('Revise your transaction.')
  const editButton = event.target
  store.editTxId = $(editButton).data('id')
  console.log(store.editTxId)
}

const onTransactionDeleteModal = (event) => {
	event.preventDefault()
	const deleteButton = event.target
	const id = $(deleteButton).data('id')
	api
		.deleteTransaction(id)
		.then(ui.onTransactionSuccess)
		.then(ui.onTransactionFailure)
}

const onTransactionDeleteSubmit = (event) => {
	event.preventDefault()
	const form = event.target
	const data = getFormFields(form)
  const id = data.transaction.id
	api.deleteTransaction(id)
		.then(ui.onTransactionSuccess)
		.then(ui.onTransactionFailure)
}

const onShowAccount = (event) => {
  event.preventDefault()
  $('#user-account-form').show()
  $('#app-tabs').hide()
  $('#app-tabs-content').hide()
  $('#account-email').text(`${store.user}`)
}

const onChangePassword = (event) => {
  event.preventDefault()
  const form = event.target
  const data = getFormFields(form)
  api.changePassword(data)
    .then(ui.onChangePasswordSuccess)
    .catch(ui.onChangePasswordFailure)
}

module.exports = {
	onSignUp,
	onSignIn,
	onSignOut,
	onTransactionSubmit,
	onTransactionEditSubmit,
	onShowAccount,
	onChangePassword,
	onTransactionDeleteSubmit,
	onTransactionDeleteModal,
	onTransactionEditModal,
}