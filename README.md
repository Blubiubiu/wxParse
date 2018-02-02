# wxParse
对wxParse的简单封装，适用于wepy
 
## 请下载这里的wxparse源码，对源码做过修改
 
使用方法： 

    1. import html2wxml from "**/**/html2wxml"
    
    2. 注册组件
    
    3. data中声明name与textContent
    
    4. 页面中使用组件<html2wxml :parserName="name" :parserContent.sync="textContent"></html2wxml>
    
    5. 获取到数据后需要 this.$invoke('html2wxml', 'htmlParserNotice')
