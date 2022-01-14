/*
Copyright (C) 2016-Today KMEE (https://kmee.com.br)
@author: Luis Felipe Mileo <mileo@kmee.com.br>
@author: Luiz Felipe do Divino <luiz.divino@kmee.com.br>
 License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/

const DOCUMENTO_CFE = "59";
const DOCUMENTO_NFCE = "65";

odoo.define("l10n_br_pos.screens", function (require) {
    "use strict";
    var screens = require("point_of_sale.screens");

    screens.PaymentScreenWidget.include({
        order_sat_is_valid: async function (order) {
            var self = this;
            return new Promise(function (resolve, reject) {
                var status = self.pos.proxy.get("status");
                var sat_status = status.drivers.hw_fiscal
                    ? status.drivers.hw_fiscal.status
                    : false;
                console.log("SAT Status: ", sat_status);
                $(".selection").append(
                    "<div data-item-index='1' class='selection-item '>Verificando status do SAT</div>"
                );
                if (sat_status == "connected") {
                    self.pos.proxy.send_order_sat(order).then(
                        (response) => {
                            console.log(response);
                            order.set_cfe_return(response);
                            resolve(true);
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                }
            });

            // } else {
            //     this.pos.push_order(currentOrder);
            // }
            //
            // if (this.pos.config.iface_print_via_proxy) {
            //     var receipt = currentOrder.export_for_printing();
            //     this.pos.proxy.print_receipt(
            //         QWeb.render('XmlReceipt', {
            //             receipt: receipt, widget: self,
            //         }));
            //     this.pos.get('selectedOrder').destroy();    //finish order and go back to scan screen
            // } else {
            //     this.pos_widget.screen_selector.set_current_screen(this.next_screen);
            // }
        },
        order_nfe_nfse_is_valid: function (order) {
            console.log("NF-E / NFS-E");
        },
        order_nfce_is_valid: function (order) {
            console.log("NFC-E");
        },
        finalize_validation: async function () {
            var self = this;
            var _super = this._super;
            self.gui.show_popup("selection", {
                title: "Processos SAT: ",
                list: [{label: "Iniciando Processo de Transmissão"}],
            });
            var order = this.pos.get_order();
            var res = await self.order_sat_is_valid(order);
            if (res === true) {
                _super.apply(this, arguments);
            }
            self.gui.close_popup();
            return res;
            // Console.log("order_is_valid")
            // console.log("order_is_valid SUPER")
            // var res = false;
            // var order = this.pos.get_order();
            // if (order.is_to_invoice()) {
            //     res |= this.order_nfe_nfse_is_valid(order);
            // } else if (order.document_type == DOCUMENTO_CFE) {
            //     console.log("order_sat_is_valid")
            //     res |= await this.order_sat_is_valid(order);
            //     console.log("order_sat_is_valid end")
            // } else if (order.document_type == DOCUMENTO_NFCE) {
            //     res |= this.order_nfce_is_valid(order);
            // }
            // res |= this._super.apply(this, arguments);
            // console.log("Return order_is_valid")
            // return res;
        },
        click_set_cnpj_cpf: function () {
            var self = this;
            var order = this.pos.get_order();
            var cnpj_cpf = order.get_cnpj_cpf();
            // TODO: Create a new pop-up without + numbers
            this.gui.show_popup("number", {
                title: cnpj_cpf ? _t("Change CNPJ/CPF") : _t("Add CNPJ/CPF"),
                value: cnpj_cpf,
                confirm: function (value) {
                    order.set_cnpj_cpf(value);
                    self.renderElement();
                },
            });
        },
        renderElement: function () {
            this._super();
            const self = this;
            this.$(".js_set_cnpj_cpf").click(function () {
                self.click_set_cnpj_cpf(self.pos.get_order().cnpj_cpf);
            });
        },
    });

    screens.ClientListScreenWidget.include({
        save_changes: function () {
            this._super();
            const order = this.pos.get_order();
            if (this.new_client?.cnpj_cpf) {
                order.set_cnpj_cpf(this.new_client.cnpj_cpf.replace(/\D/g, ""));
            } else {
                order.set_cnpj_cpf('');
            }
            this.pos.gui.screen_instances.payment.renderElement();
        }
    });

    // Screens.PaymentScreenWidget = screens.PaymentScreenWidget.extend({
    //     order_is_valid: function (parent, options) {
    //         var res = PaymentScreenWidgetSuper.prototype.order_is_valid.call(this, parent, options);
    //         return res;
    //
    //
    //         options = options || {};
    //         var currentOrder = this.pos.get('selectedOrder');
    //
    //         if (this.pos.config.iface_sat_via_proxy) {
    //             var status = this.pos.proxy.get('status');
    //             var sat_status = status.drivers.satcfe ? status.drivers.satcfe.status : false;
    //             if (this.pos.config.cpf_nota) {
    //                 this.pos_widget.action_bar.set_button_disabled('validation', true);
    //             }
    //             if (!cpf_na_nota)
    //                 currentOrder.attributes.cpf_nota = null;
    //             if (sat_status == 'connected') {
    //                 if (options.invoice) {
    //                     // deactivate the validation button while we try to send the order
    //                     this.pos_widget.action_bar.set_button_disabled('validation', true);
    //                     this.pos_widget.action_bar.set_button_disabled('invoice', true);
    //
    //                     var invoiced = this.pos.push_and_invoice_order(currentOrder);
    //
    //                     invoiced.fail(function (error) {
    //                         if (this.pos.config.cpf_nota) {
    //                             this.pos_widget.action_bar.set_button_disabled('validation', true);
    //                         } else {
    //                             this.pos_widget.action_bar.set_button_disabled('validation', false);
    //                         }
    //                         if (error === 'error-no-client') {
    //                             this.pos_widget.screen_selector.show_popup('error', {
    //                                 message: _t('An anonymous order cannot be invoiced'),
    //                                 comment: _t('Please select a client for this order. This can be done by clicking the order tab'),
    //                             });
    //                         } else {
    //                             this.pos_widget.screen_selector.show_popup('error', {
    //                                 message: _t('The order could not be sent'),
    //                                 comment: _t('Check your internet connection and try again.'),
    //                             });
    //                         }
    //
    //                         this.pos_widget.action_bar.set_button_disabled('invoice', false);
    //                     });
    //
    //                     invoiced.done(function () {
    //                         if (this.pos.config.cpf_nota) {
    //                             this.pos_widget.action_bar.set_button_disabled('validation', true);
    //                         } else {
    //                             this.pos_widget.action_bar.set_button_disabled('validation', false);
    //                         }
    //                         this.pos_widget.action_bar.set_button_disabled('invoice', false);
    //                         var ultima_venda = this.pos.get('selectedOrder');
    //                         this.pos.get('selectedOrder').destroy();
    //                     });
    //
    //                 } else {
    //                     var retorno_sat = {};
    //                     if (this.pos.config.iface_sat_via_proxy) {
    //                         this.pos_widget.action_bar.set_button_disabled('validation', true);
    //                         var receipt = currentOrder.export_for_printing();
    //                         var json = currentOrder.export_for_printing();
    //                         self.pos.proxy.send_order_sat(
    //                             currentOrder,
    //                             QWeb.render('XmlReceipt', {
    //                                 receipt: receipt, widget: self,
    //                             }), json);
    //                     } else {
    //                         this.pos.push_order(currentOrder);
    //                     }
    //
    //                     if (this.pos.config.iface_print_via_proxy) {
    //                         var receipt = currentOrder.export_for_printing();
    //                         this.pos.proxy.print_receipt(
    //                             QWeb.render('XmlReceipt', {
    //                                 receipt: receipt, widget: self,
    //                             }));
    //                         this.pos.get('selectedOrder').destroy();    //finish order and go back to scan screen
    //                     } else {
    //                         this.pos_widget.screen_selector.set_current_screen(this.next_screen);
    //                     }
    //                 }
    //             } else {
    //                 this.pos_widget.screen_selector.show_popup('error', {
    //                     message: _t('SAT n\u00e3o est\u00e1 conectado'),
    //                     comment: _t('Verifique se existe algum problema com o SAT e tente fazer a requisi\u00e7\u00e3o novamente.'),
    //                 });
    //             }
    //         } else {
    //             this.pos.push_order(currentOrder);
    //             if (this.pos.config.iface_print_via_proxy) {
    //                 var receipt = currentOrder.export_for_printing();
    //                 this.pos.proxy.print_receipt(QWeb.render('XmlReceipt', {
    //                     receipt: receipt, widget: self,
    //                 }));
    //                 this.pos.get('selectedOrder').destroy();    //finish order and go back to scan screen
    //             } else {
    //                 this.pos_widget.screen_selector.set_current_screen(this.next_screen);
    //             }
    //         }
    //
    //     }

    // init: function(parent, options) {
    //     var self = this;
    //     this._super(parent, options);
    //
    //     this.hotkey_handler = function(event){
    //         if (self.pos.config.cpf_nota) {
    //             if(event.which === 13){
    //                 self.validar_cpf_nota();
    //                 $('.busca-cpf-cnpj-popup').focus();
    //             }else if(event.which === 27){
    //                 self.back();
    //             }
    //         } else {
    //             if(event.which === 13){
    //                 self.validate_order();
    //             }else if(event.which === 27){
    //                 self.back();
    //             }
    //         }
    //     };
    // },
    // validar_cpf_nota: function() {
    //     var self = this;
    //     self.pos_widget.screen_selector.show_popup('cpf_nota_sat_popup',{
    //         message: _t('Deseja inserir o cpf no cupom fiscal?')
    //     });
    // },

    // show: function(){
    //     this._super();
    //     var self = this;
    //     if (this.pos.config.cpf_nota) {
    //         this.pos_widget.action_bar.destroy_buttons();
    //         this.add_action_button({
    //             label: _t('Back'),
    //             icon: '/point_of_sale/static/src/img/icons/png48/go-previous.png',
    //             click: function(){
    //                 self.back();
    //             }
    //         });
    //         this.add_action_button({
    //             label: _t('Venda SAT'),
    //             name: 'venda_sat',
    //             icon: '/point_of_sale/static/src/img/icons/png48/validate.png',
    //             click: function () {
    //                 if(!cpf_na_nota || (cpf_na_nota && self.pos.config.crm_ativo))
    //                     self.pos_widget.payment_screen.validate_order();
    //                 else
    //                     self.validar_cpf_nota();
    //             }
    //         });
    //         this.update_payment_summary();
    //     }
    // },
    // update_payment_summary: function() {
    //     this._super();
    //     var self = this;
    //
    //     if(self.pos_widget.action_bar){
    //         self.pos_widget.action_bar.set_button_disabled('venda_sat', !self.is_paid());
    //     }
    // }
    // });

    // function l10n_br_pos_screens(instance, module) {
    //     var QWeb = instance.web.qweb;
    //     var _t = instance.web._t;
    //     var save_state = false;
    //     var cpf_na_nota = false;
    //     var ultima_venda = false;
    //     var list_orders_frontend = [];
    //
    //     module.ScreenWidget.prototype.barcode_product_action = function (code) {
    //             var self = this;
    //             if(!save_state) {
    //                 if (self.pos.scan_product(code)) {
    //                     if (self.barcode_product_screen && !self.pos.config.crm_ativo) {
    //                         self.pos_widget.screen_selector.set_current_screen(self.barcode_product_screen);
    //                     }
    //                 } else {
    //                     self.pos_widget.screen_selector.show_popup('error-barcode', code.code);
    //                 }
    //             }
    //     };
    //
    //     module.HaveCpfCnpj = module.OrderWidget.include({
    //         template: 'PosWidget',
    //
    //         init: function(parent, options){
    //             this._super(parent);
    //             var self = this;
    //         },
    //
    //         renderElement: function() {
    //             var self = this;
    //             this._super();
    //             if(self.pos.config.crm_ativo)
    //                 $(".pos-leftpane *").prop('disabled', save_state);
    //
    //             $('.deleteorder-button').click(function(e){
    //                 save_state = false;
    //             });
    //
    //             this.el.querySelector('.busca-cpf-cnpj').addEventListener('keydown',this.search_handler);
    //             $('.busca-cpf-cnpj', this.el).keydown(function(e){
    //                 if(e.which == 13){
    //                     self.search_client_by_cpf_cnpj($('.busca-cpf-cnpj').val().replace(/[^\d]+/g,''));
    //                 }
    //             });
    //
    //             this.el.querySelector('.btn-busca-cpf-cnpj').addEventListener('click',this.search_handler);
    //             $('.btn-busca-cpf-cnpj', this.el).click(function(e){
    //                 self.search_client_by_cpf_cnpj($('.busca-cpf-cnpj').val().replace(/[^\d]+/g,''));
    //             });
    //
    //         },
    //
    //         verifica_campos_vazios: function(partner){
    //             for (key in partner){
    //                 if ((key != 'ean13' && key != 'vat' && key != 'opt_out' && key != 'city' && key != 'mobile' && key != 'whatsapp' && key != 'street2') && (partner[key] == null || partner[key] === false || partner[key] === 'false' || partner[key] === ''))
    //                     return true
    //             }
    //             return false
    //         },
    //
    //         // calcula_diferenca_data: function(data_alteracao){
    //         //     if(data_alteracao){
    //         //         var today = new Date();
    //         //         if (parseInt(data_alteracao.substr(8,2)) < 12){
    //         //             data_alteracao = data_alteracao.substr(0, 4) + '-' + data_alteracao.substr(8, 2) + '-' + data_alteracao.substr(5, 2) //dia,mes e ano
    //         //         }
    //         //         var date_partner = new Date(data_alteracao);
    //         //         var lim_data_alteracao = parseInt(this.pos.config.lim_data_alteracao);
    //         //         if( Math.floor((today.getTime() - date_partner.getTime())*3.81E-10) <= lim_data_alteracao)
    //         //             return true;
    //         //     }
    //         //     return false;
    //         // },
    //
    //         bind_order_events: function() {
    //         var self = this;
    //            var order = this.pos.get('selectedOrder');
    //                order.unbind('change:client', this.client_change_handler);
    //                order.bind('change:client', this.client_change_handler);
    //            var lines = order.get('orderLines');
    //                lines.unbind();
    //                lines.bind('add', function(){
    //                        if(lines.length == 1 && this.pos.config.crm_ativo){
    //                            self.pos_widget.screen_selector.show_popup('cpf_nota_sat_popup',{
    //                            message: _t('Informar CPF'),
    //                            });
    //                        }
    //                        this.numpad_state.reset();
    //                        this.renderElement(true);
    //                    },this);
    //                lines.bind('remove', function(line){
    //                        this.remove_orderline(line);
    //                        this.numpad_state.reset();
    //                        this.update_summary();
    //                    },this);
    //                lines.bind('change', function(line){
    //                        this.rerender_orderline(line);
    //                        this.update_summary();
    //                    },this);
    //         },
    //
    //         update_summary: function(){
    //             var order = this.pos.get('selectedOrder');
    //             var total     = order ? order.getTotalTaxIncluded() : 0;
    //             var taxes     = order ? total - order.getTotalTaxExcluded() : 0;
    //
    //             this.el.querySelector('.summary .total > .value').textContent = this.format_currency(total);
    //             this.el.querySelector('.summary .total .subentry .value').textContent = this.format_currency(taxes);
    //             if(this.pos.get('selectedOrder').attributes.client) {
    //                 $('.client_mostra').show();
    //                 $('.date_cliente').text(this.pos.get('selectedOrder').attributes.client.create_date.substr(0, 7));
    //                 $('.name_cliente').text(this.pos.get('selectedOrder').attributes.client.name);
    //                 $('.tempo_cliente').text(this.pos.db.tempo_cliente(this.pos.get('selectedOrder').attributes.client.create_date) + ' meses');
    //             }
    //         },
    //
    //         active_client: function (self, documento, partner) {
    //             pos_db = self.pos.db;
    //             self.old_client = partner;
    //             self.new_client = self.old_client;
    //             if (partner) {
    //                 self.pos.get('selectedOrder').set_client(self.new_client);
    //                 if(self.pos.config.crm_ativo && (!this.calcula_diferenca_data(partner.data_alteracao) || this.verifica_campos_vazios(partner))){
    //                     var ss = self.pos.pos_widget.screen_selector;
    //                     ss.set_current_screen('clientlist');
    //                     self.pos_widget.clientlist_screen.edit_client_details(partner);
    //                 }
    //
    //             } else {
    //                 if (self.pos.config.save_identity_automatic) {
    //                     new_partner = {};
    // //                  new_partner["name"] = pos_db.add_pontuation_document(documento);
    //                     new_partner["name"] = 'Anônimo';
    //                     new_partner['create_date'] =  new Date(pos_db.today_date());
    //                     if (new_partner["name"].length > 14) {
    //                         new_partner["is_company"] = true;
    //                     }
    //                     new_partner["cnpj_cpf"] = pos_db.add_pontuation_document(documento);
    //                     self.pos_widget.order_widget.save_client_details(new_partner);
    //                     if(self.pos.config.crm_ativo && (!this.calcula_diferenca_data(new_partner.data_alteracao) || this.verifica_campos_vazios(new_partner))){
    //                         var ss = self.pos.pos_widget.screen_selector;
    //                         ss.set_current_screen('clientlist');
    //                         self.pos_widget.clientlist_screen.display_client_details('edit',{
    //                         'cnpj_cpf': new_partner['cnpj_cpf'], 'name':'Anônimo'});
    //                     }
    //                 }
    //             }
    //         },
    //
    //         search_client_by_cpf_cnpj: function(documento) {
    //             var self = this;
    //
    //             if (self.verificar_cpf_cnpj(documento)){
    //                 pos_db = self.pos.db;
    //                 partner = pos_db.get_partner_by_identification(self.pos.partners, documento);
    //                 if(partner){
    //                     for (key in partner){
    //                         if (partner[key] === 'false')
    //                             partner[key] = null;
    //                     }
    //                         this.active_client(self, documento, partner);
    //                 } else {
    //                     documento_pontuacao = pos_db.add_pontuation_document(documento);
    //                     return new instance.web.Model("res.partner").get_func("search_read")([['cnpj_cpf', '=', documento_pontuacao]], ['name', 'cnpj_cpf', 'country_id']).then(function(res) {
    //                         if (res){
    //                             pos_db.add_partners(res);
    //                         }
    //                         self.active_client(self, documento, res[0]);
    //                     },function(err,event) {
    //                         self.active_client(self, documento, partner);
    //                     });
    //                 }
    //             } else {
    //                 self.pos_widget.screen_selector.show_popup('error',{
    //                     message: _t('CPF/CNPJ digitado esta incorreto!'),
    //                 });
    //             }
    //         },
    //         save_client_details: function(partner) {
    //             var self = this;
    //
    //             var fields = {};
    //             this.$('.client-details-contents .detail').each(function(idx,el){
    //                 fields[el.name] = el.value;
    //             });
    //
    //             if (!partner.name) {
    //                 this.pos_widget.screen_selector.show_popup('error',{
    //                     message: _t('Um nome de usuário é obrigatório'),
    //                 });
    //                 return;
    //             }
    //
    //             if (this.uploaded_picture) {
    //                 fields.image = this.uploaded_picture;
    //             }
    //
    //             fields.id           = partner.id || false;
    //             fields.country_id   = fields.country_id || false;
    //             fields.ean13        = fields.ean13 ? this.pos.barcode_reader.sanitize_ean(fields.ean13) : false;
    //
    //             if(this.pos.company.parent_id){
    //                 partner['company_id'] = this.pos.company.parent_id[0];
    //             }
    //
    //             new instance.web.Model('res.partner').call('create_from_ui',[partner]).then(function(partner_id){
    //                 self.pos.pos_widget.clientlist_screen.reload_partners().then(function(){
    //                     var new_partner = self.pos.db.get_partner_by_id(partner_id);
    //                     for (key in new_partner){
    //                         if (new_partner[key] === false)
    //                             new_partner[key] = null;
    //                     }
    //                     if (new_partner['address'].replace(/,|\s/g,'') == '')
    //                         new_partner['address'] = null;
    //                     new_partner['country_id'] = false
    // //                    new_partner['cnpj_cpf'] = new_partner['name'];
    //                     if (self.pos.config.pricelist_id){
    //                        new_partner['property_product_pricelist'][0] = self.pos.pricelist.id;
    //                     }
    //                     self.old_client = new_partner;
    //                     self.new_client = self.old_client;
    //                     self.pos.get('selectedOrder').set_client(self.new_client);
    //                     if (self.pos.config.pricelist_id){
    //                         self.pos.pricelist_engine.update_products_ui(self.new_client);
    //                     }
    //                     self.pos.partners.push(new_partner);
    //                     return true;
    //                 });
    //             },function(err,event){
    //                 // Nao deixa o javascript mostrar sua mensagem de erro
    //                 event.preventDefault();
    //                 self.pos_widget.screen_selector.show_popup('error',{
    //                     'message':_t('Error: Não foi possível salvar o cpf'),
    //                     'comment':_t('O cpf já existe no sistema ou não foi possível cadastrá-lo no banco de dados.'),
    //                 });
    //                 return false;
    //             });
    //
    //
    //         },
    //         verificar_cpf_cnpj: function(documento){
    //             if (documento.length <= 11){
    //                 var Soma;
    //                 var Resto;
    //                 Soma = 0;
    //                 if (documento == "00000000000" ||
    //                     documento == "11111111111" ||
    //                     documento == "22222222222" ||
    //                     documento == "33333333333" ||
    //                     documento == "44444444444" ||
    //                     documento == "55555555555" ||
    //                     documento == "66666666666" ||
    //                     documento == "77777777777" ||
    //                     documento == "88888888888" ||
    //                     documento == "99999999999")
    //                     return false;
    //
    //                 for (i=1; i<=9; i++) Soma = Soma + parseInt(documento.substring(i-1, i)) * (11 - i);
    //                 Resto = (Soma * 10) % 11;
    //
    //                 if ((Resto == 10) || (Resto == 11))  Resto = 0;
    //                 if (Resto != parseInt(documento.substring(9, 10)) ) return false;
    //
    //                 Soma = 0;
    //                 for (i = 1; i <= 10; i++) Soma = Soma + parseInt(documento.substring(i-1, i)) * (12 - i);
    //                 Resto = (Soma * 10) % 11;
    //
    //                 if ((Resto == 10) || (Resto == 11))  Resto = 0;
    //                 if (Resto != parseInt(documento.substring(10, 11) ) ) return false;
    //                 return true;
    //             }else{
    //                 documento = documento.replace(/[^\d]+/g,'');
    //
    //                 if(documento == '') return false;
    //
    //                 if (documento.length != 14)
    //                     return false;
    //
    //                 // Elimina CNPJs invalidos conhecidos
    //                 if (documento == "00000000000000" ||
    //                     documento == "11111111111111" ||
    //                     documento == "22222222222222" ||
    //                     documento == "33333333333333" ||
    //                     documento == "44444444444444" ||
    //                     documento == "55555555555555" ||
    //                     documento == "66666666666666" ||
    //                     documento == "77777777777777" ||
    //                     documento == "88888888888888" ||
    //                     documento == "99999999999999")
    //                     return false;
    //
    //                 // Valida DVs
    //                 tamanho = documento.length - 2
    //                 numeros = documento.substring(0,tamanho);
    //                 digitos = documento.substring(tamanho);
    //                 soma = 0;
    //                 pos = tamanho - 7;
    //                 for (i = tamanho; i >= 1; i--) {
    //                   soma += numeros.charAt(tamanho - i) * pos--;
    //                   if (pos < 2)
    //                         pos = 9;
    //                 }
    //                 resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    //                 if (resultado != digitos.charAt(0))
    //                     return false;
    //
    //                 tamanho = tamanho + 1;
    //                 numeros = documento.substring(0,tamanho);
    //                 soma = 0;
    //                 pos = tamanho - 7;
    //                 for (i = tamanho; i >= 1; i--) {
    //                   soma += numeros.charAt(tamanho - i) * pos--;
    //                   if (pos < 2)
    //                         pos = 9;
    //                 }
    //                 resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    //                 if (resultado != digitos.charAt(1))
    //                       return false;
    //
    //                 return true;
    //             }
    //         }
    //     });
    //
    //     module.ClientListScreenWidget = module.ClientListScreenWidget.extend({
    //         save_client_details: function(partner) {
    //             var self = this;
    //             var fields = {}
    //             this.$('.client-details-contents .detail').each(function(idx,el){
    //                 fields[el.name] = el.value;
    //             });
    //             if (!fields.cnpj_cpf){
    //                 this.pos_widget.screen_selector.show_popup('error',{
    //                     message: _t('Erro no cadastro!'),
    //                     comment:_t('Um CPF é obrigatório.')
    //                 });
    //             } else {
    //                 var cliente_cpf = fields.cnpj_cpf;
    //                 if (self.pos_widget.order_widget.verificar_cpf_cnpj(cliente_cpf.replace(/[^\d]+/g,''))){
    //                     pos_db = self.pos.db;
    //                     partner = pos_db.get_partner_by_identification(self.pos.partners, cliente_cpf.replace(/[^\d]+/g,''));
    //                     partner['user_ids'] = partner.user_ids || [];
    //                     fields.id           = partner.id || false;
    //                     fields.ean13        = fields.ean13 ? this.pos.barcode_reader.sanitize_ean(fields.ean13) : false;
    //                     partner.name = fields.name;
    //                     partner.birthdate = fields.birthdate;
    //                     partner.cnpj_cpf = fields.cnpj_cpf;
    //                     var country = this.pos.countries.find(function(element) {return element.id==fields.country_id;}) || false;
    //                     partner.email = fields.email;
    //                     partner.gender = fields.gender;
    //                     var city = this.pos.cities.find(function(element) {return element.id==fields.l10n_br_city_id});
    //                     partner.number = fields.number;
    //                     partner.opt_out = 'sim'  === fields.opt_out;
    //                     partner.phone = fields.phone;
    //                     partner.street = fields.street;
    //                     partner.street2 = fields.street2;
    //                     partner.whatsapp = 'sim' === fields.whatsapp;
    //                     partner.zip = fields.zip;
    //                     partner.data_alteracao = this.pos.db.today_date();
    //                     if (partner.create_date == null){
    //                         partner.create_date = new Date(this.pos.db.today_date());
    //                     }
    //                     $(document).ready(function(){
    //                         if (country != null)
    //                             partner.country_id = [country.id, country.name];
    //                         if (city != null) {
    //                             partner.l10n_br_city_id = [city.id, city.name];
    //                             partner.state_id = [city.state_id[0], city.state_id[1]];
    //                         }
    //                     });
    //                     new instance.web.Model('res.partner').call('create_from_ui', [fields]).then(function (partner_id) {
    //                         self.saved_client_details(partner_id);
    //                     }, function (err, event) {
    //                         // Nao deixa o javascript mostrar sua mensagem de erro
    //                         event.preventDefault();
    //                         self.pos_widget.screen_selector.show_popup('error', {
    //                             'message': _t('Error: Could not Save Changes'),
    //                             'comment': _t('CPF já cadastrado no sistema.'),
    //                         });
    //                     });
    //                 } else {
    //                     this.pos_widget.screen_selector.show_popup('error', {
    //                         message: _t('Erro no cadastro!'),
    //                         comment: _t('CPF inválido!.')
    //                     });
    //                 }
    //             }
    //         },
    //
    //         // what happens when we've just pushed modifications for a partner of id partner_id
    //         saved_client_details: function(partner_id){
    //             var self = this;
    //             this.reload_partners().then(function(){
    //                     var partner = self.pos.db.get_partner_by_id(partner_id);
    //                 if (partner) {
    //                     var date = new Date();
    //                     partner['user_ids'] = partner.user_ids || [];
    // //                  usando o pricelist da loja por padrao
    //                     partner['property_product_pricelist'][0] = self.pos.pricelist.id;
    //                     partner.birthdate = $('.birthdate').val();
    //                     partner.data_alteracao = date.getFullYear() + '-' + date.getMonth();
    //                     partner.street2 = $('.client-address-street2').val()
    //                     partner.gender = $('.gender').val()
    //                     partner.whatsapp = 'sim' === $('.whatsapp').val()
    //                     partner.opt_out = 'sim' === $('.opt_out').val()
    //
    //                     self.new_client = partner;
    //                     self.toggle_save_button();
    //                     self.pos.get('selectedOrder').set_client(self.new_client);
    //                     var ss = self.pos.pos_widget.screen_selector;
    //                     ss.set_current_screen('products');
    // //                  self.display_client_details('show',partner);
    //                 } else {
    //                     // should never happen, because create_from_ui must return the id of the partner it
    //                     // has created, and reload_partner() must have loaded the newly created partner.
    //                     self.display_client_details('hide');
    //                 }
    //             });
    //         },
    //
    //         carrega_cep: function(country_id, state_id, l10n_br_city){
    //             if(country_id != null){
    //                 new instance.web.Model('res.country.state').call('get_states_ids', [country_id]).then(function (result) {
    //                 $('.client-address-state').children('option:not(:first)').remove();
    //                     $.each(result, function(key, value){
    //                         if(state_id != null && state_id == key){
    //                              $('.client-address-state').append($("<option></option>")
    //                                           .attr("value",key)
    //                                           .attr("selected",true)
    //                                           .text(value));
    //                         }
    //                         else{
    //                             $('.client-address-state').append($("<option></option>")
    //                                           .attr("value",key)
    //                                           .text(value));
    //                         }
    //                     });
    //                 });
    //             }
    //             if(state_id != null){
    //                     new instance.web.Model('l10n_br_base.city').call('get_city_ids', [state_id]).then(function (result) {
    //                     $('.client-address-city').children('option:not(:first)').remove();
    //                         $.each(result, function(key, value){
    //                             if(l10n_br_city != null && l10n_br_city == key){
    //                             $('.client-address-city').append($("<option></option>")
    //                                               .attr("value",key)
    //                                               .attr("selected", true)
    //                                               .text(value));
    //                             }
    //                             else{
    //                              $('.client-address-city').append($("<option></option>")
    //                                               .attr("value",key)
    //                                               .text(value));
    //                             }
    //                         });
    //                     });
    //             }
    //         },
    //
    //         display_client_details: function(visibility,partner,clickpos){
    //             var self = this;
    //             var contents = this.$('.client-details-contents');
    //             var parent   = this.$('.client-list').parent();
    //             var scroll   = parent.scrollTop();
    //             var height   = contents.height();
    //             contents.off('click','.button.edit');
    //             contents.off('click','.button.save');
    //             contents.off('click','.button.undo');
    //             contents.on('click','.button.edit',function(){ self.edit_client_details(partner); });
    //             contents.on('click','.button.save',function(){ self.save_client_details(partner); });
    //             contents.on('click','.button.undo',function(){ self.undo_client_details(partner); });
    //             this.editing_client = false;
    //             this.uploaded_picture = null;
    //
    //             if(visibility === 'show'){
    //                 for (key in partner){
    //                     if ((key != 'ean13' && key != 'vat' && key != 'opt_out' && key != 'country_id' && key != 'city' && key != 'mobile' && key != 'whatsapp' && key != 'street2') && (partner[key] == null || partner[key] === false || partner[key] === 'false'))
    //                         partner[key] = null;
    //                 }
    //                 contents.empty();
    //                 contents.append($(QWeb.render('ClientDetails',{widget:this,partner:partner})));
    //
    //                 var new_height   = contents.height();
    //
    //                 if(!this.details_visible){
    //                     if(clickpos < scroll + new_height + 20 ){
    //                         parent.scrollTop( clickpos - 20 );
    //                     }else{
    //                         parent.scrollTop(parent.scrollTop() + new_height);
    //                     }
    //                 }else{
    //                     parent.scrollTop(parent.scrollTop() - height + new_height);
    //                 }
    //
    //                 this.details_visible = true;
    //                 this.toggle_save_button();
    //             } else if (visibility === 'edit') {
    //                 for (key in partner){
    //                     if ((key != 'ean13' && key != 'vat' && key != 'country_id' && key != 'opt_out' && key != 'city' && key != 'mobile' && key != 'whatsapp') && (partner[key] == null || partner[key] === false || partner[key] === 'false'))
    //                     partner[key] = null;
    //                 }
    //                 this.editing_client = true;
    //                 contents.empty();
    //                 contents.append($(QWeb.render('ClientDetailsEdit',{widget:this,partner:partner})));
    //                 this.toggle_save_button();
    //
    //                $( document ).ready(function() {
    //                     if(partner.country_id != null && partner.state_id != null && partner.l10n_br_city_id != null)
    //                         self.pos_widget.clientlist_screen.carrega_cep(partner.country_id[0], partner.state_id[0], partner.l10n_br_city_id[0]);
    //                     else if(partner.country_id != null && partner.state_id != null)
    //                         self.pos_widget.clientlist_screen.carrega_cep(partner.country_id[0], partner.state_id[0]);
    //                     else if(partner.country_id != null)
    //                       self.pos_widget.clientlist_screen.carrega_cep(partner.country_id[0]);
    //                 });
    // 		       $('.client-address-country', this.el).change(function(e){
    //                 var country_id = $('.client-address-country').val();
    //                 if (country_id != ""){
    //                     new instance.web.Model('res.country.state').call('get_states_ids', [country_id]).then(function (result) {
    //                         $('.client-address-state').children('option:not(:first)').remove();
    //                             $.each(result, function(key, value){
    //                                 $('.client-address-state').append($("<option></option>")
    //                                                       .attr("value",key)
    //                                                       .text(value));
    //                             });
    //                         });
    //                 }
    //                    });
    //                $('.client-address-state', this.el).change(function(e){
    //                 var state_id = $('.client-address-state').val();
    //                 if (state_id != ""){
    //                 new instance.web.Model('l10n_br_base.city').call('get_city_ids', [state_id]).then(function (result) {
    //                     $('.client-address-city').children('option:not(:first)').remove();
    //                         $.each(result, function(key, value){
    //                             $('.client-address-city').append($("<option></option>")
    //                                                   .attr("value",key)
    //                                                   .text(value));
    //                         });
    //                     });
    //                     }
    //                 });
    //
    //                 $('.client-address-zip', this.el).blur(function(e){
    //                     var cep = $('.client-address-zip').val().replace(/[^\d]+/g,'');
    //                         if (cep.length == 8){
    //                             new instance.web.Model('l10n_br.zip').call('zip_search_multi_json', [[]], {'zip_code': cep}).then(function (result) {
    //                                 $('.client-address-street').val(result.street);
    //                                 $('.client-address-country').val(result.country_id);
    //                                 self.pos_widget.clientlist_screen.carrega_cep($('.client-address-country').val(), result.state_id,result.l10n_br_city);
    //                             });
    //                         }
    //                         else{
    //                             self.pos_widget.screen_selector.show_popup('error',{
    //                                 message: _t('Erro no campo!'),
    //                                 comment:_t('CEP inválido!')
    //                             });
    //                         }
    //                 });
    //
    //                 contents.find('.image-uploader').on('change',function(event){
    //                     self.load_image_file(event.target.files[0],function(res){
    //                         if (res) {
    //                             contents.find('.client-picture img, .client-picture .fa').remove();
    //                             contents.find('.client-picture').append("<img src='"+res+"'>");
    //                             contents.find('.detail.picture').remove();
    //                             self.uploaded_picture = res;
    //                         }
    //                     });
    //                 });
    //             } else if (visibility === 'hide') {
    //                 contents.empty();
    //                 if( height > scroll ){
    //                     contents.css({height:height+'px'});
    //                     contents.animate({height:0},400,function(){
    //                         contents.css({height:''});
    //                     });
    //                 }else{
    //                     parent.scrollTop( parent.scrollTop() - height);
    //                 }
    //                 this.details_visible = false;
    //                 this.toggle_save_button();
    //             }
    //         },
    //
    //         edit_client_details: function(partner) {
    //             this._super(partner);
    //
    //         },
    //
    //         re_update_products: function(partner) {
    //             if (!partner.cnpj_cpf){
    //                this._super(partner);
    //             }
    //         }
    //     });
    //
    //     module.CPFNaNotaPopupWidget = module.PopUpWidget.extend({
    //         template: 'CPFNaNota',
    //         hotkeys_handlers: {},
    //
    //
    //         cpf_cupom_fiscal: function(currentOrder){
    //             self = this;
    //             var cpf = $('.busca-cpf-cnpj-popup').val();
    //             if (cpf){
    //                 if(!cpf_na_nota){
    //                     $(".pos-leftpane *").prop('disabled', save_state);
    //                     self.pos_widget.screen_selector.close_popup();
    //                 }
    //                 if (!currentOrder.client) {
    //                     $(".pos-leftpane *").prop('disabled', save_state);
    //                     self.pos_widget.screen_selector.close_popup();
    //                     if (self.pos_widget.order_widget.verificar_cpf_cnpj(cpf.replace(/[^\d]+/g,''))) {
    //                         $(".pos-leftpane *").prop('disabled', save_state);
    //                         self.pos_widget.screen_selector.close_popup();
    //                         pos_db = self.pos.db;
    //                         partner = pos_db.get_partner_by_identification(self.pos.partners, cpf.replace(/[^\d]+/g, ''));
    //                         if (partner) {
    //                             self.pos.get('selectedOrder').set_client(partner);
    //                             currentOrder = self.pos.get('selectedOrder').attributes;
    //                             currentOrder["cpf_nota"] = cpf.replace(/[^\d]+/g,'');
    //                             if(self.pos.config.crm_ativo && (!this.pos_widget.order_widget.calcula_diferenca_data(partner.data_alteracao) || this.pos_widget.order_widget.verifica_campos_vazios(partner))){
    //                                 var ss = self.pos.pos_widget.screen_selector;
    //                                 ss.set_current_screen('clientlist');
    //                                 self.pos_widget.clientlist_screen.edit_client_details(partner);
    //                             }
    //                             if(!self.pos.config.crm_ativo && cpf_na_nota)
    //                                 self.pos_widget.payment_screen.validate_order();
    //                         } else {
    //                             new_partner = {};
    //                             new_partner["name"] = 'Anônimo';
    //                             if (new_partner["name"].length > 14) {
    //                                 new_partner["is_company"] = true;
    //                             }
    //                             new_partner["cnpj_cpf"] = cpf;
    //
    //                             new instance.web.Model('res.partner').call('create_from_ui', [new_partner]).then(function (partner_id) {
    //                                 self.pos.pos_widget.clientlist_screen.reload_partners().then(function () {
    //                                     var new_partner = self.pos.db.get_partner_by_id(partner_id);
    //                                     for (key in new_partner){
    //                                         if (new_partner[key] == false)
    //                                             new_partner[key] = null;
    //                                     }
    //                                     new_partner['user_ids'] = [];
    //                                     new_partner['country_id'] = false
    //                                     new_partner['cnpj_cpf'] = cpf;
    //                                     if (self.pos.config.pricelist_id) {
    //                                         new_partner['property_product_pricelist'][0] = self.pos.pricelist.id;
    //                                     }
    //                                     self.old_client = new_partner;
    //                                     self.new_client = self.old_client;
    //                                     self.pos.get('selectedOrder').set_client(self.new_client);
    //                                     if (self.pos.config.crm_ativo) {
    //                                         var ss = self.pos.pos_widget.screen_selector;
    //                                         ss.set_current_screen('clientlist');
    //                                         self.pos_widget.clientlist_screen.edit_client_details(self.old_client);
    //                                     }
    //                                     if (self.pos.config.pricelist_id) {
    //                                         self.pos.pricelist_engine.update_products_ui(self.new_client);
    //                                     }
    //                                     self.pos.partners.push(new_partner);
    //                                     return true;
    //                                 }).then(function () {
    //                                     currentOrder = self.pos.get('selectedOrder').attributes;
    //                                     currentOrder["cpf_nota"] = cpf.replace(/[^\d]+/g,'');
    //                                     if(!self.pos.config.crm_ativo && cpf_na_nota)
    //                                         self.pos_widget.payment_screen.validate_order();
    //                                 });
    //                             });
    //                         }
    //                     } else {
    //                         alert('CPF/CNPJ digitado esta incorreto!');
    //                         // self.pos_widget.screen_selector.show_popup('error',{
    //                         //     message: _t('CPF/CNPJ digitado esta incorreto!'),
    //                         // });
    //                     }
    //                 } else {
    //                     pos_db = self.pos.db;
    //                     partner = pos_db.get_partner_by_identification(self.pos.partners, cpf.replace(/[^\d]+/g, ''));
    //                     for (key in partner){
    //                         if (partner[key] === 'false' )
    //                             partner[key] = null;
    //                     }
    //                     $(".pos-leftpane *").prop('disabled', save_state);
    //                     self.pos_widget.screen_selector.close_popup();
    //                     currentOrder = self.pos.get('selectedOrder').attributes;
    //                     currentOrder["cpf_nota"] = cpf.replace(/[^\d]+/g,'');
    //                     // this.active_client(self, documento, partner);
    //                     if(self.pos.config.crm_ativo && (!this.pos_widget.order_widget.calcula_diferenca_data(partner.data_alteracao) || this.pos_widget.order_widget.verifica_campos_vazios(partner))){
    //                         var ss = self.pos.pos_widget.screen_selector;
    //                         ss.set_current_screen('clientlist');
    //                         self.pos_widget.clientlist_screen.edit_client_details(partner);
    //                     }
    //                 }
    //             } else {
    //                 $(".pos-leftpane *").prop('disabled', save_state);
    //                 self.pos_widget.screen_selector.close_popup();
    //                 if(cpf_na_nota)
    //                     alert('O cpf deve ser inserido no campo para que seja transmitido no cupom fiscal.');
    //             }
    //         },
    //
    //         show: function(options){
    //             var self = this;
    //             this._super();
    //             this.message = options.message || '';
    //
    //             this.comment = options.comment || '';
    //
    //             var currentOrder = this.pos.get('selectedOrder').attributes;
    //             if (currentOrder.client) {
    //                 this.cpf_nota = currentOrder.client.cnpj_cpf;
    //                 this.create_date = currentOrder.client.create_date.substring(0,7);
    //                 this.atualizacao = self.pos_widget.order_widget.calcula_diferenca_data(currentOrder.client.data_alteracao);
    //                 this.renderElement();
    //             }
    //             else{
    //                 this.cpf_nota = '';
    //                 this.renderElement();
    //                 $('#cliente_label_popup').hide();
    //                 $('#checkbox_popup').hide();
    //
    //             }
    //
    //             this.hotkey_handler = function (event) {
    //                 if (event.which === 13) {
    //                     cpf_na_nota = true;
    //                     save_state = false;
    //                     self.cpf_cupom_fiscal(currentOrder);
    //                 }
    //             };
    //
    //             $('.busca-cpf-cnpj-popup').on('keyup',this.hotkey_handler);
    //             save_state = true;
    //             this.$('.button.sim').click(function(){
    //                 cpf_na_nota = true;
    //                 save_state = false;
    //                 self.cpf_cupom_fiscal(currentOrder);
    //             });
    //
    //             this.$('.button.nao').click(function(){
    //                 cpf_na_nota = false;
    //                 save_state = false;
    //                 self.pos_widget.screen_selector.close_popup();
    //                 if(!self.pos.config.crm_ativo)
    //                     self.pos_widget.payment_screen.validate_order();
    //                 else{
    //                     self.cpf_cupom_fiscal(currentOrder);
    //                 }
    //             });
    //         }
    //     });
    //
    //     module.PosOrderListWidget = module.PosBaseWidget.extend({
    //         template: 'PosOrderListWidget',
    //         renderElement: function() {
    //             var self = this;
    //             this._super();
    //
    //             var button = new module.PosOrderListButtonWidget(self,{
    //                 pos: self.pos,
    //                 pos_widget : self.pos_widget,
    //             });
    //             button.appendTo(self.$el);
    //         }
    //     });
    //
    //     module.PosOrderListButtonWidget = module.PosBaseWidget.extend({
    //         template: 'PosOrderListButtonWidget',
    //         init: function(parent, options){
    //             this._super(parent, options);
    //             this.cashregister = options.cashregister;
    //         },
    //         renderElement: function() {
    //             var self = this;
    //             this._super();
    //
    //             this.$el.click(function(){
    //                 var ss = self.pos.pos_widget.screen_selector;
    //                 if(ss.get_current_screen() === 'posordertlist'){
    //                     ss.back();
    //                 }else if (ss.get_current_screen() !== 'receipt'){
    //                     ss.set_current_screen('posordertlist');
    //                 }
    //             });
    //         },
    //     });
    //
    //
    //     module.PosOrderListScreenWidget = module.ScreenWidget.extend({
    //         template: 'PosOrderListScreenWidget',
    //
    //         init: function(parent, options){
    //             this._super(parent, options);
    //             this.orders = {};
    //             // var self = this;
    //             // this.get_last_orders();
    //         },
    //
    //         show_leftpane: false,
    //
    //         auto_back: true,
    //
    //         show: function(){
    //             var self = this;
    //             this._super();
    //
    //             this.renderElement();
    //             this.details_visible = false;
    //             this.get_last_orders();
    //
    //             this.$('.back').click(function(){
    //                 self.pos_widget.screen_selector.back();
    //             });
    //
    //             this.render_list(self.orders.Orders);
    //             this.$('.client-list-contents').delegate('.cancel_order','click',function(event){
    //                 var order_id = $(this).parent().parent().data('id');
    //                 if(order_id == ''){
    //                     self.pos_widget.screen_selector.show_popup('error', {
    //                         message: _t('Erro:Cancelar Venda'),
    //                         comment: _t('Última venda ainda não foi sincronizada'),
    //                     });
    //                 }
    //                 else {
    //                     self.pos_widget.screen_selector.show_popup('confirm', {
    //                         message: _t('Cancelar Venda'),
    //                         comment: _t('Voc\u00ea realmente deseja cancelar est\u00e1 venda?'),
    //                         confirm: function () {
    //                             var posOrderModel = new instance.web.Model('pos.order');
    //                             var posOrder = posOrderModel.call('retornar_order_by_id', {'order_id': order_id})
    //                                 .then(function (order) {
    //                                     self.cancel_last_order_sat(order);
    //                                 },function(err,event){
    //                                     // Nao deixa o javascript mostrar sua mensagem de erro
    //                                     event.preventDefault();
    //                                     self.pos_widget.screen_selector.show_popup('error',{
    //                                         'message':_t('Erro: Não foi possível acessar o backend!'),
    //                                         'comment':_t('Tente novamente em alguns instantes.')
    //                                     });
    //                                     return false;});
    //                         },
    //                     });
    //                 }
    //
    //             });
    //             this.$('.client-list-contents').delegate('.reprint_order','click',function(event){
    //                 self.reprint_cfe($(this).parent().parent().data('id'));
    //             });
    //         },
    //
    //         push_list_order_frontend: function (currentOrder) {
    //             date = new Date(currentOrder.attributes.creationDate);
    //             dict_order = {
    //                 can_cancel: true,
    //                 canceled_order: false,
    //                 chave_cfe: currentOrder.chave_cfe,
    //                 date: date.getFullYear() + '-' + ((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)) + '-' + (date.getDay() < 10 ? '0' + date.getDay() : date.getDay()) + ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()),
    //                 id: '',
    //                 name: '',//"LJ 0005 / CAIXA 1/900006030 / 000159",
    //                 partner: false,
    //                 pos_reference: currentOrder.attributes.name,
    //                 total: currentOrder.selected_paymentline.amount ? currentOrder.selected_paymentline.amount.toFixed(2) : 0
    //             };
    //             var aux_list = [];
    //             aux_list[0] = dict_order;
    //             if (list_orders_frontend.length != 0) {
    //                 for (var i = 1; i < 5 && i <= list_orders_frontend.length; i++) {
    //                     aux_list[i] = list_orders_frontend[i - 1];
    //                 }
    //             }
    //             list_orders_frontend = aux_list;
    //             this.get_last_orders();
    //         },
    //
    //         get_last_orders: function(){
    //             var self = this;
    //             var session_id = {'session_id': self.pos.pos_session.id};
    //             var posOrderModel = new instance.web.Model('pos.order');
    //             var posOrder = posOrderModel.call('return_orders_from_session', session_id)
    //             .then(function (orders) {
    //                 var aux_list = [];
    //                 var cont_tam = 0;
    //                 for (var i=0; i < 5 && i < list_orders_frontend.length; i++)
    //                     aux_list[cont_tam++] = list_orders_frontend[i];
    //
    //                 for (var i=0; i < orders.Orders.length; i++){
    //                     var index = -1;
    //                     for (var j=0; j< 5 && j < list_orders_frontend.length; j++){
    //                         if(list_orders_frontend[j].chave_cfe == orders.Orders[i].chave_cfe){
    //                              index = j;
    //                             break;
    //                         }
    //                     }
    //                     if(index != -1)
    //                         aux_list[index] = orders.Orders[i];
    //                     else
    //                         aux_list[cont_tam++] = orders.Orders[i];
    //                 }
    //                 for (var i=1; i < aux_list.length; i++){
    //                     aux_list[i].can_cancel = false;
    //                 }
    //                 self.orders.Orders = aux_list;
    //             },function(err,event){
    //                 // Nao deixa o javascript mostrar sua mensagem de erro
    //                 event.preventDefault();
    //                 self.pos_widget.screen_selector.show_popup('error',{
    //                     'message':_t('Erro: Não foi possível acessar o backend!'),
    //                     'comment':_t('Tente novamente em alguns instantes.')
    //                 });
    //                 return false;});
    //         },
    //         reprint_cfe: function(order_id){
    //             var self = this;
    //
    //             var posOrderModel = new instance.web.Model('pos.order');
    //             var posOrder = posOrderModel.call('retornar_order_by_id', {'order_id': order_id})
    //             .then(function (result) {
    //                 self.pos.proxy.reprint_cfe(result);
    //             });
    //         },
    //         render_list: function(orders){
    //             var orders_vals = orders;
    //
    //             var contents = this.$el[0].querySelector('.client-list-contents');
    //             contents.innerHTML = "";
    //             if (orders_vals) {
    //                 for(var i = 0; i < orders_vals.length; i++){
    //                     var order    = orders_vals[i];
    //                     var clientline_html = QWeb.render('OrderLine',{widget: this, order:orders_vals[i]});
    //                     var clientline = document.createElement('tbody');
    //                     clientline.innerHTML = clientline_html;
    //                     clientline = clientline.childNodes[1];
    //
    //                     contents.appendChild(clientline);
    //                 }
    //             }
    //         },
    //         cancel_last_order_sat: function(order){
    //             var self = this;
    //
    //             var status = this.pos.proxy.get('status');
    //             var sat_status = status.drivers.satcfe ? status.drivers.satcfe.status : false;
    //             if( sat_status == 'connected'){
    //                 if(this.pos.config.iface_sat_via_proxy){
    //                     this.pos.proxy.cancel_last_order(order);
    //                 }
    //             }
    //         },
    //         close: function(){
    //             this._super();
    //         },
    //     });
    //
    //     module.ReceiptScreenWidget = module.ScreenWidget.extend({
    //         template: 'ReceiptScreenWidget',
    //
    //         show_numpad:     false,
    //         show_leftpane:   false,
    //
    //         show: function(){
    //             this._super();
    //             var self = this;
    //
    //             var finish_button = this.add_action_button({
    //                     label: _t('Next Order'),
    //                     icon: '/point_of_sale/static/src/img/icons/png48/go-next.png',
    //                     click: function() { self.finishOrder(); },
    //                 });
    //
    //             this.refresh();
    //
    //             //
    //             // The problem is that in chrome the print() is asynchronous and doesn't
    //             // execute until all rpc are finished. So it conflicts with the rpc used
    //             // to send the orders to the backend, and the user is able to go to the next
    //             // screen before the printing dialog is opened. The problem is that what's
    //             // printed is whatever is in the page when the dialog is opened and not when it's called,
    //             // and so you end up printing the product list instead of the receipt...
    //             //
    //             // Fixing this would need a re-architecturing
    //             // of the code to postpone sending of orders after printing.
    //             //
    //             // But since the print dialog also blocks the other asynchronous calls, the
    //             // button enabling in the setTimeout() is blocked until the printing dialog is
    //             // closed. But the timeout has to be big enough or else it doesn't work
    //             // 2 seconds is the same as the default timeout for sending orders and so the dialog
    //             // should have appeared before the timeout... so yeah that's not ultra reliable.
    //
    //             finish_button.set_disabled(true);
    //             setTimeout(function(){
    //                 finish_button.set_disabled(false);
    //             }, 2000);
    //         },
    //         finishOrder: function() {
    //             // this.pos_widget.posorderlist_screen.get_last_orders();
    //             this.pos.get('selectedOrder').destroy();
    //         },
    //         refresh: function() {
    //             var order = this.pos.get('selectedOrder');
    //             $('.pos-receipt-container', this.$el).html(QWeb.render('PosTicket',{
    //                     widget:this,
    //                     order: order,
    //                     orderlines: order.get('orderLines').models,
    //                     paymentlines: order.get('paymentLines').models,
    //                 }));
    //         },
    //         close: function(){
    //             this._super();
    //         }
    //     });
    return screens;
});
