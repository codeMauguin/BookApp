#import "Hello.h"

@implementation MultiThreadManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(performMultiThreadTask:(RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // 在这里执行耗时操作
        
        // 执行JavaScript回调函数
        callback(@[[NSNull null]]);
    });
}

@end
//#import "Hello.h"
//
//@implementation MyNativeModule
//
//RCT_EXPORT_MODULE();
//
//RCT_EXPORT_METHOD(executeFunction:(RCTResponseSenderBlock)callback)
//{
//    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
//        // 执行JavaScript传递的函数
//        NSString *result = [self executeCallback:callback];
//        
//        // 将结果返回给JavaScript
//        NSArray *response = @[result];
//        callback(response);
//    });
//}
//
//- (NSString *)executeCallback:(RCTResponseSenderBlock)callback
//{
//    // 在这里编写你的Objective-C/C++代码
//    // 执行JavaScript传递的函数，并返回结果
//    
//    // 这里只是一个示例，返回一个字符串
//    return @"Hello from Objective-C/C++";
//}
//
//@end
