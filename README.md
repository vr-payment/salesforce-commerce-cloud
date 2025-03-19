# Salesforce Commerce Cloud VRPayment Cartridge

VRPayment provides LINK cartridges to integrate with Salesforce Commerce Cloud (SFCC). These cartridges enable a SFRA storefront to use the VRPayment payment service. These cartridges support SFRA version 4.x.x.

## Requirements

It is required to have an VRPayment account to use these cartridges. Please signup [here](https://gateway.vr-payment.de/user/login).

## Integration
Our cartridges integrate the checkout process with VRPayment. Each of the steps below are required to get your VRPayment integration working. You need admin rights to the instance you are uploading these cartridges to.

### 1. Upload cartridge

_To import the cartridges please use [Salesforce Commerce Cloud CLI](https://github.com/SalesforceCommerceCloud/sfcc-ci). Check the [`sfcc-ci code:deploy`](https://github.com/SalesforceCommerceCloud/sfcc-ci#pushing-code) command._

1. Upload these cartridges to your site 

2. Administration >  Sites >  Manage Sites > *YourSite* > Settings : Add `int_vrpayment:` to the beginning of the __Cartridges:__ string and apply

3. Administration >  Sites >  Manage Sites > Business Manager  > Settings : Add `bm_vrpayment:int_vrpayment:` to the beginning of the __Cartridges:__ string and apply. Please do this for each of the sites.

4. Administration >  Organization >  Roles > Administrator - Business Manager Modules : Enable `VRPayment` for each of the users you would like to be able to configure `VRPayment`.

### 2. Upload metadata
Please rename the folder `yourSiteId` to the name of your site, and please replicate the folder for each of your sites before zipiping.
1. `zip metadata`
2. Administration >  Site Development >  Site Import & Export > Import > metadata.zip

### 3. Add vrpayment payment method
* Merchant Tools >  Ordering >  Payment Methods : Verify that `VRPAYMENT` is the only payment method enabled. Optionally you can leave `CREDIT_CARD` enabled also.

### 4. Add vrpayment payment processor

* Merchant Tools >  Ordering >  Payment Processors > Verify that a processor with ID: `VRPAYMENT` exists.


### 5. Apply credentials
Have your VRPayment credentials handy.

* Merchant Tools > Site Preferences > VRPayment

If the path `Merchant Tools > Site Preferences > VRPayment` does not exist, please repeat steps 1.3 and 1.4. 


### 6. Profit
Congratulations! You are now integrated with VRPayment.

## Installation, Usage and Configuration

Installation, Usage and Configuration is explained in VRPayment's [online documentation](https://gateway.vr-payment.de/doc/salesforce-commerce-cloud/1.0.16/docs/en/documentation.html).

## Support

For further questions regarding the integration to VRPayment, contact the [VRPayment Support](https://www.vr-payment.de/hotline).

## License

Please see the [license file](https://github.com/vr-payment/vrpayment-salesforce-commerce-cloud/blob/master/LICENSE) for more information.