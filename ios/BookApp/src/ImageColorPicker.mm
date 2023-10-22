
#import "ImageColorPicker.h"
#import <CoreImage/CoreImage.h>

@implementation ImageColorPicker
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(analyzeImage:(NSString *)base64Image  findEventsWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData* imageData = [[NSData alloc] initWithBase64EncodedString:base64Image options:NSDataBase64DecodingIgnoreUnknownCharacters];

    // 将NSData转换为UIImage
    UIImage* image = [UIImage imageWithData:imageData];
    
    // 调用 getPaletteImageColor 方法
    [image getPaletteImageColor:^(PaletteColorModel *blockColorModel, NSDictionary *blockAllModeColorDic, NSError *blockError) {
      if(blockError){
        reject(@"color_error", @"Failed to get main color", blockError);
      }else{
        NSString *colorHexString = blockColorModel.imageColorString;
           resolve(colorHexString);
      }
    }];
  });
    
}


@end
