var AlipayNotify = require('./alipay_notify.class').AlipayNotify;    
var AlipaySubmit = require('./alipay_submit.class').AlipaySubmit;
var  assert = require('assert');
var url = require('url');
var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;
	
var DOMParser = require('./xmldom').DOMParser;

var default_alipay_config = {
	partner:'' //���������id����2088��ͷ��16λ������
	,key:''//��ȫ�����룬�����ֺ���ĸ��ɵ�32λ�ַ�
	,seller_email:'' //����֧�����ʻ� ����
	,host:'http://localhost:3000/' //����
	,cacert:'cacert.pem'//ca֤��·����ַ������curl��sslУ�� �뱣֤cacert.pem�ļ��ڵ�ǰ�ļ���Ŀ¼��
	,transport:'http' //����ģʽ,�����Լ��ķ������Ƿ�֧��ssl���ʣ���֧����ѡ��https������֧����ѡ��http
	,input_charset:'utf-8'//�ַ������ʽ Ŀǰ֧�� gbk �� utf-8
	,sign_type:"MD5"//ǩ����ʽ �����޸�
	,sec_id:"MD5"//wap��ҳ֧��ǩ����ʽ �����޸�
	,create_direct_pay_by_user_return_url : '/alipay/create_direct_pay_by_user/return_url'
	,create_direct_pay_by_user_notify_url: '/alipay/create_direct_pay_by_user/notify_url'
	,refund_fastpay_by_platform_pwd_notify_url : '/alipay/refund_fastpay_by_platform_pwd/notify_url'
	,create_partner_trade_by_buyer_notify_url: '/aplipay/create_partner_trade_by_buyer/notify_url'
	,create_partner_trade_by_buyer_return_url: '/aplipay/create_partner_trade_by_buyer/return_url'
	
	,trade_create_by_buyer_return_url : '/alipay/trade_create_by_buyer/return_url'
	,trade_create_by_buyer_notify_url: '/alipay/trade_create_by_buyer/notify_url'

	,create_direct_pay_by_wap_return_url : '/alipay/create_direct_pay_by_wap/return_url'
	,create_direct_pay_by_wap_notify_url: '/alipay/create_direct_pay_by_wap/notify_url'
};
			
function Alipay(alipay_config){		
	EventEmitter.call(this);
	
	//default config
	this.alipay_config = default_alipay_config;
	//config merge
	for(var key in alipay_config){
		this.alipay_config[key] = alipay_config[key];
	}		
}

/**
 * @ignore
 */
inherits(Alipay, EventEmitter);

Alipay.prototype.route = function(app){
	var self = this;
	app.get(this.alipay_config.create_direct_pay_by_user_return_url, function(req, res){self.create_direct_pay_by_user_return(req, res)});
	app.post(this.alipay_config.create_direct_pay_by_user_notify_url, function(req, res){self.create_direct_pay_by_user_notify(req, res)});
	app.post(this.alipay_config.refund_fastpay_by_platform_pwd_notify_url, function(req, res){self.refund_fastpay_by_platform_pwd_notify(req, res)});

	app.get(this.alipay_config.create_partner_trade_by_buyer_return_url, function(req, res){self.create_partner_trade_by_buyer_return(req, res)});
	app.post(this.alipay_config.create_partner_trade_by_buyer_notify_url, function(req, res){self.create_partner_trade_by_buyer_notify(req, res)});
	
	app.get(this.alipay_config.trade_create_by_buyer_return_url, function(req, res){self.trade_create_by_buyer_return(req, res)});
	app.post(this.alipay_config.trade_create_by_buyer_notify_url, function(req, res){self.trade_create_by_buyer_notify(req, res)});

	app.get(this.alipay_config.create_direct_pay_by_wap_return_url, function(req, res){self.create_direct_pay_by_wap_return(req, res)});
	app.post(this.alipay_config.create_direct_pay_by_wap_notify_url, function(req, res){self.create_direct_pay_by_wap_notify(req, res)});
}

//֧������ʱ���ʽ��׽ӿ�
/*data{
 out_trade_no:'' //�̻�������, �̻���վ����ϵͳ��Ψһ�����ţ�����
 ,subject:'' //�������� ����
 ,total_fee:'' //������,����
 ,body:'' //��������
 ,show_url:'' //��Ʒչʾ��ַ ����http://��ͷ������·�������磺http://www.xxx.com/myorder.html
 }*/

Alipay.prototype.create_direct_pay_by_user = function(data, res){
	assert.ok(data.out_trade_no && data.subject && data.total_fee);

	//��������
	var alipaySubmit = new AlipaySubmit(this.alipay_config);

	var parameter = {
		service:'create_direct_pay_by_user'
		,partner:this.alipay_config.partner
		,payment_type:'1' //֧������
		,notify_url: url.resolve(this.alipay_config.host, this.alipay_config.create_direct_pay_by_user_notify_url)//�������첽֪ͨҳ��·��,��������޸�, ��http://��ʽ������·�������ܼ�?id=123�����Զ������
		,return_url: url.resolve(this.alipay_config.host , this.alipay_config.create_direct_pay_by_user_return_url)//ҳ����תͬ��֪ͨҳ��·�� ��http://��ʽ������·�������ܼ�?id=123�����Զ������������д��http://localhost/
		,seller_email:this.alipay_config.seller_email //����֧�����ʻ� ����		
		,_input_charset:this.alipay_config['input_charset'].toLowerCase().trim()
	};
	for(var key in data){
		parameter[key] = data[key];
	}
	
	var html_text = alipaySubmit.buildRequestForm(parameter,"get", "ȷ��");
	res.send(html_text);
}

//��ʱ���������˿����ܽӿ�
/* 	data{
	refund_date:'',//�˿������, �����ʽ����[4λ]-��[2λ]-��[2λ] Сʱ[2λ 24Сʱ��]:��[2λ]:��[2λ]���磺2007-10-01 13:13:13
	batch_no: '', //���κ�, �����ʽ����������[8λ]+���к�[3��24λ]���磺201008010000001
	batch_num:'', //�˿����, �������detail_data��ֵ�У���#���ַ����ֵ�������1�����֧��1000�ʣ�����#���ַ����ֵ�����999����
	detail_data: '',//�˿���ϸ���� ��������ʽ��μ��ӿڼ����ĵ�
} */
Alipay.prototype.refund_fastpay_by_platform_pwd = function(data, res){
	assert.ok(data.refund_date && data.batch_no && data.batch_num && data.detail_data);
	//��������
	var alipaySubmit = new AlipaySubmit(this.alipay_config);
	
	//����Ҫ����Ĳ������飬����Ķ�
	var parameter = {
		service : 'refund_fastpay_by_platform_pwd',
		partner : this.alipay_config.partner,
		notify_url	: url.resolve(this.alipay_config.host, this.alipay_config.refund_fastpay_by_platform_pwd_notify_url),
		seller_email	: this.alipay_config.seller_email,
		
		refund_date	: data.refund_date,
		batch_no	: data.batch_no,
		batch_num	: data.batch_num,
		detail_data	: data.detail_data,
		
		_input_charset	: this.alipay_config['input_charset'].toLowerCase().trim()
	};

	var html_text = alipaySubmit.buildRequestForm(parameter,"get", "ȷ��");
	res.send(html_text);
}

//֧�������������׽ӿڽӿ�

Alipay.prototype.create_partner_trade_by_buyer = function(data, res){
	//��������
	var alipaySubmit = new AlipaySubmit(this.alipay_config);
	
	//����Ҫ����Ĳ������飬����Ķ�
	var parameter = {
		service : 'create_partner_trade_by_buyer',
		partner : this.alipay_config.partner,
		payment_type: '1',
		notify_url	: url.resolve(this.alipay_config.host, this.alipay_config.create_partner_trade_by_buyer_notify_url),
		return_url : url.resolve(this.alipay_config.host , this.alipay_config.create_partner_trade_by_buyer_return_url),
		seller_email	: this.alipay_config.seller_email, 
		
		out_trade_no	: data.out_trade_no,
		subject	: data.subject,
		price	: data.price,
		quantity	: data.quantity,
		logistics_fee	: data.logistics_fee,
		logistics_type	: data.logistics_type,
		logistics_payment	: data.logistics_payment,
		body	: data.body,
		show_url	: data.show_url,
		receive_name	: data.receive_name,
		receive_address	: data.receive_address,
		receive_zip	: data.receive_zip,
		receive_phone	: data.receive_phone,
		receive_mobile	: data.receive_mobile,
		
		_input_charset	: this.alipay_config['input_charset'].toLowerCase().trim()
	};

	var html_text = alipaySubmit.buildRequestForm(parameter,"get", "ȷ��");
	res.send(html_text);
}

Alipay.prototype.send_goods_confirm_by_platform = function(data, res){
	//��������
	var alipaySubmit = new AlipaySubmit(this.alipay_config);
	
	//����Ҫ����Ĳ������飬����Ķ�
	var parameter = {
		service : 'send_goods_confirm_by_platform',
		partner : this.alipay_config.partner,
		
		trade_no : data.trade_no,
		logistics_name : data.logistics_name,
		invoice_no : data.invoice_no,
		transport_type : data.transport_type,
		
		_input_charset	: this.alipay_config['input_charset'].toLowerCase().trim()
	};

	alipaySubmit.buildRequestHttp(parameter, function(html_text){
		//����XML html_text
		var doc = new DOMParser().parseFromString(html_text);
		var is_success = doc.getElementsByTagName('is_success').item(0).firstChild.nodeValue
		if(is_success == 'T'){
			var out_trade_no = doc.getElementsByTagName('out_trade_no').item(0).firstChild.nodeValue;
			var trade_no = doc.getElementsByTagName('trade_no').item(0).firstChild.nodeValue;
			self.emit('send_goods_confirm_by_platform_success', out_trade_no, trade_no, html_text);
		}
		else if(is_success == 'F'){
			var error = doc.getElementsByTagName('error').item(0).firstChild.nodeValue;
			self.emit('send_goods_confirm_by_platform_fail', error);
		}
	});		
}

Alipay.prototype.trade_create_by_buyer = function(data, res){
	//��������
	var alipaySubmit = new AlipaySubmit(this.alipay_config);
	
	//����Ҫ����Ĳ������飬����Ķ�
	var parameter = {
		service : 'trade_create_by_buyer',
		partner : this.alipay_config.partner,
		payment_type: '1',
		notify_url	: url.resolve(this.alipay_config.host, this.alipay_config.trade_create_by_buyer_notify_url),
		return_url : url.resolve(this.alipay_config.host , this.alipay_config.trade_create_by_buyer_return_url),
		seller_email	: this.alipay_config.seller_email, 
		
		out_trade_no	: data.out_trade_no,
		subject	: data.subject,
		price	: data.price,
		quantity	: data.quantity,
		logistics_fee	: data.logistics_fee,
		logistics_type	: data.logistics_type,
		logistics_payment	: data.logistics_payment,
		body	: data.body,
		show_url	: data.show_url,
		receive_name	: data.receive_name,
		receive_address	: data.receive_address,
		receive_zip	: data.receive_zip,
		receive_phone	: data.receive_phone,
		receive_mobile	: data.receive_mobile,
		
		_input_charset	: this.alipay_config['input_charset'].toLowerCase().trim()
	};

	var html_text = alipaySubmit.buildRequestForm(parameter,"get", "ȷ��");
	res.send(html_text);
}

Alipay.prototype.trade_create_by_buyer_return = function(req, res){
	var self = this;

	var _GET = req.query;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyReturn(_GET, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _GET['out_trade_no'];
			//֧�������׺�
			var trade_no = _GET['trade_no'];
			//����״̬
			var trade_status = _GET['trade_status'];
			
			if(trade_status  == 'WAIT_BUYER_PAY'){                
				self.emit('trade_create_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
				self.emit('trade_create_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
				self.emit('trade_create_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_FINISHED'){                
				self.emit('trade_create_by_buyer_trade_finished', out_trade_no, trade_no);
			}
			
			res.send("success");
		}
		else{
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});	
}

Alipay.prototype.trade_create_by_buyer_notify = function(req, res){
	var self = this;

	var _POST = req.body;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyNotify(_POST, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _POST['out_trade_no'];
			//֧�������׺�
			var trade_no = _POST['trade_no'];
			//����״̬
			var trade_status = _POST['trade_status'];
			
			if(trade_status  == 'WAIT_BUYER_PAY'){                
				self.emit('trade_create_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
				self.emit('trade_create_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
				self.emit('trade_create_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_FINISHED'){                
				self.emit('trade_create_by_buyer_trade_finished', out_trade_no, trade_no);
			}
			
			res.send("success");
		}
		else{
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});	
}

Alipay.prototype.refund_fastpay_by_platform_pwd_notify = function(req, res){
	 var self = this;

	var _POST = req.body;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyNotify(_POST, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//���κ�
			var batch_no = _POST['batch_no'];
			//�����˿�������ת�˳ɹ��ı���
			var success_num = _POST['success_num'];
			//�����˿������е���ϸ��Ϣ
			var result_details = _POST['result_details'];
			
			self.emit('refund_fastpay_by_platform_pwd_success', batch_no, success_num, result_details);
			
			res.send("success");		//�벻Ҫ�޸Ļ�ɾ��
		}
		else{
			 //��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});
}

Alipay.prototype.create_partner_trade_by_buyer_return = function(req, res){
	var self = this;

	var _GET = req.query;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyReturn(_GET, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _GET['out_trade_no'];
			//֧�������׺�
			var trade_no = _GET['trade_no'];
			//����״̬
			var trade_status = _GET['trade_status'];
			
			if(trade_status  == 'WAIT_BUYER_PAY'){                
				self.emit('create_partner_trade_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
				self.emit('create_partner_trade_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
				self.emit('create_partner_trade_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_FINISHED'){                
				self.emit('create_partner_trade_by_buyer_trade_finished', out_trade_no, trade_no);
			}
			
			res.send("success");
		}
		else{
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});	
}

Alipay.prototype.create_partner_trade_by_buyer_notify = function(req, res){
	var self = this;

	var _POST = req.body;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyNotify(_POST, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _POST['out_trade_no'];
			//֧�������׺�
			var trade_no = _POST['trade_no'];
			//����״̬
			var trade_status = _POST['trade_status'];
			
			if(trade_status  == 'WAIT_BUYER_PAY'){                
				self.emit('create_partner_trade_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
				self.emit('create_partner_trade_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
				self.emit('create_partner_trade_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_FINISHED'){                
				self.emit('create_partner_trade_by_buyer_trade_finished', out_trade_no, trade_no);
			}
			
			res.send("success");
		}
		else{
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});	
}

Alipay.prototype.create_direct_pay_by_user_notify = function(req, res){
	var self = this;

	var _POST = req.body;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyNotify(_POST, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _POST['out_trade_no'];
			//֧�������׺�
			var trade_no = _POST['trade_no'];
			//����״̬
			var trade_status = _POST['trade_status'];

			if(trade_status  == 'TRADE_FINISHED'){                
				self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_SUCCESS'){                
				self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
			}
			res.send("success");		//�벻Ҫ�޸Ļ�ɾ��
		}
		else {
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});	
}

Alipay.prototype.create_direct_pay_by_user_return = function(req, res){		
	var self = this;
	
	var _GET = req.query;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	alipayNotify.verifyReturn(_GET, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _GET['out_trade_no'];
			//֧�������׺�
			var trade_no = _GET['trade_no'];
			//����״̬
			var trade_status = _GET['trade_status'];

			if(trade_status  == 'TRADE_FINISHED'){                
				self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_SUCCESS'){                
				self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
			}

			res.send("success");		//�벻Ҫ�޸Ļ�ɾ��
		}
		else {
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});
	
}

//֧������ʱ���ʽ��׽ӿ�
/*data{
 seller_email:'' //�������䣬����
 ,out_trade_no:'' //�̻�������, �̻���վ����ϵͳ��Ψһ�����ţ�����
 ,subject:'' //�������� ����
 ,total_fee:'' //������,����
 }*/

Alipay.prototype.create_direct_pay_by_wap = function(data, res){
	assert.ok(data.out_trade_no && data.subject && data.total_fee && data.merchant_url);
	var self = this;
	//��������
	var alipaySubmit = new AlipaySubmit(this.alipay_config);
	var notify_url = url.resolve(this.alipay_config.host, this.alipay_config.create_direct_pay_by_wap_notify_url);
	var call_back_url = url.resolve(this.alipay_config.host , this.alipay_config.create_direct_pay_by_wap_return_url);
	var seller_email = this.alipay_config.seller_email;
	var req_data = "<direct_trade_create_req><notify_url>" + notify_url + "</notify_url><call_back_url>" + call_back_url + "</call_back_url><seller_account_name>" + seller_email + "</seller_account_name><out_trade_no>" + data.out_trade_no + "</out_trade_no><subject>" + data.subject + "</subject><total_fee>" + data.total_fee + "</total_fee><merchant_url>" + data.merchant_url + "</merchant_url></direct_trade_create_req>";

	var parameter = {
		service:'alipay.wap.trade.create.direct'
		,format: 'xml'
		,v:'2.0'
		,req_data: req_data
		,req_id: new Date().getTime().toString()
		,partner:this.alipay_config.partner
		,sec_id: 'MD5'
	};
	
	alipaySubmit.buildWapRequestHttp(parameter, function(respHtml){
		var request_token = alipaySubmit.getRequestToken(respHtml);
		var req_data = "<auth_and_execute_req><request_token>" + request_token + "</request_token></auth_and_execute_req>";
		var parameter2 = {
			service:'alipay.wap.auth.authAndExecute'
			,partner:self.alipay_config.partner
			,_input_charset:self.alipay_config['input_charset'].toLowerCase().trim()
			,format: 'xml'
			,v:'2.0'
			,req_data: req_data
			,sec_id: 'MD5'
		};
		var formHtml = alipaySubmit.buildWapRequestForm(parameter2, "get", "ȷ��");
		res.send(formHtml);
	});

}

Alipay.prototype.create_direct_pay_by_wap_notify = function(req, res){
	var self = this;

	var _POST = req.body;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	//��֤��Ϣ�Ƿ���֧���������ĺϷ���Ϣ
	alipayNotify.verifyWapNotify(_POST, function(verify_result){
        console.log('####create_direct_pay_by_wap_notify:', _POST);
        console.log('####verify_result:', verify_result);
		if(verify_result) {//��֤�ɹ�
			var notify_data = _POST['notify_data'];
            var doc = new DOMParser().parseFromString(notify_data);
			//�̻�������
            var out_trade_no = doc.getElementsByTagName("out_trade_no").item(0).firstChild.nodeValue;
			//֧�������׺�
            var trade_no = doc.getElementsByTagName("trade_no").item(0).firstChild.nodeValue;
			//����״̬
            var trade_status = doc.getElementsByTagName("trade_status").item(0).firstChild.nodeValue;

			if(trade_status  == 'TRADE_FINISHED'){                
				self.emit('create_direct_pay_by_wap_trade_finished', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_SUCCESS'){                
				self.emit('create_direct_pay_by_wap_trade_success', out_trade_no, trade_no);
			}
			res.send("success");		//�벻Ҫ�޸Ļ�ɾ��
		}
		else {
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});	
}

Alipay.prototype.create_direct_pay_by_wap_return = function(req, res){		
	var self = this;
	
	var _GET = req.query;
	//����ó�֪ͨ��֤���
	var alipayNotify = new AlipayNotify(this.alipay_config);
	alipayNotify.verifyReturn(_GET, function(verify_result){
		if(verify_result) {//��֤�ɹ�
			//�̻�������
			var out_trade_no = _GET['out_trade_no'];
			//֧�������׺�
			var trade_no = _GET['trade_no'];
			//����״̬
			var trade_status = _GET['trade_status'];

			var result = _GET['result'];

			if(trade_status  == 'TRADE_FINISHED'){                
				self.emit('create_direct_pay_by_wap_trade_finished', out_trade_no, trade_no);
			}
			else if(trade_status == 'TRADE_SUCCESS' || result == 'success'){                
				self.emit('create_direct_pay_by_wap_trade_success', out_trade_no, trade_no);
			}

      var redirect_url = url.resolve(self.alipay_config.host , self.alipay_config.create_direct_pay_by_wap_redirect_url) + '?out_trade_no=' + out_trade_no;
      res.redirect(redirect_url);
		}
		else {
			//��֤ʧ��
			self.emit("verify_fail");
			res.send("fail");
		}
	});
	
}


	
exports.Alipay = Alipay;
    



