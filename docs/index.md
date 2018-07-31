## おや？夏休みの自由研究かい？
ひょっとして君は、夏休みの自由研究に、BME280を使って、気温と気圧、そして湿度の測定をしようとしている小学生かな？  
すごい！がんばれ！きっとできる！下に書いてあることをよく読んでやってみよう！  
よく読んでも、わからないことがあるときは、近くの人に聞いてみよう！その人が知らなくても、ほかに詳しそうな人をしっているかもしれない。きっと君の助けになると思うよ。だから一人で悩んじゃダメだ。  

## BME280とは？
BME280は、ドイツのBOSCHという会社が作った、気温と気圧、そして湿度を正確にはかるためのセンサーだ。しかも、マイコンとつながるためのインターフェースも持っている。これをマイクロビットにつなげば、BME280が正確な 気温と気圧、湿度を測って、マイクロビットに送ってくれるわけだ。マイクロビットにも、温度計はついているんだけど、これでは、あまり正確に気温を測ることができないんだ。（どうしてかっていうと、マイクロビットの温度計は、マイクロビットのCPUの温度を測るためについているからで、気温を測るためについているんじゃないんだ。）  
もしも、君が英語もスラスラ読めるすごい小学生なら、以下のリンクにBME280のことがもっと詳しくかいてあるよ。  
https://www.bosch-sensortec.com/bst/products/all_products/bme280  

## さっそく準備しよう！
### これだけは絶対必要！
- パソコン  
MacでもWindowsでも大丈夫だよ。ただし、USBインターフェースがちゃんと使えること。
それから以下のホームページを開いて、ちゃんと表示されないと、マイクロビットのプログラミングができないよ。  
[https://makecode.microbit.org/](https://makecode.microbit.org/)  
もしも、マイクロビットを使ったことがないなら、はじめは簡単なプログラムをいくつか書いてみよう。  
マイクロビットを持ってなくても、さっきのホームページで、プログラムを書いて、パソコンンに保存することはできるぞ！まずは、ちゃんとプログラムをパソコンに保存できるか確認しよう！  

- マイクロビット  
持ってなかったら、買ってもらうしかない！  
はじめは、単四電池で動かせる電池ボックスのついたスターターキッドがおすすめだよ！  
[これは、売っていたお店（マルツ）のリンク](https://www.marutsu.co.jp/pc/i/839896/)  
![microbit](image000.jpg)  

- BME280 I2C ボード  
持ってなかったら、買ってもらうしかない！  
だけど、これが難しい。君のそばに、詳しい人がいてくれるといいんだけど...  
以下のリンクが、僕が使ったのと同じものが売っているお店のものだよ。  
[これは、売っていたお店（秋月電子通商）のリンク](http://akizukidenshi.com/catalog/g/gK-09421/)  
これ以外にも、インターネットで探すと、いろいろな種類のボードが見つかるよ。
BME280だけじゃなくて、必ず基盤についているやつを選んでね。あと、マイコンとの接続に、I2CとSPIという2種類があるんだけど、I2Cが使えるものを選んでね。  
ちなみに、僕が買ったボードは、コネクターがはんだ付けされてなかったから、大人の人に付けてもらったよ。はんだ付けはあぶないから、できる大人の人に頼もう！  
よくわからないときは、必ず詳しい人に聞いてから買ってもらおう。高くても1000円ぐらいで買えると思うよ。  
![BME280](image001.jpg)  

### もっていると、とても便利なもの！
- マイクロビット用のブレイクアウトボード  
ブレイクアウトボードは、マイクロビットを、後で説明するブレッドボードにつなぐ時にとても便利なものだよ。  
これは、マイクロビット用ならば、どんなブレイクアウトボードでも、ブレッドボードに接続できれば大丈夫！  
[これは、売っていたお店（マルツ）のリンク](https://www.marutsu.co.jp/pc/i/839840/)
![BreakoutBoard](image01.jpg)  

- ブレッドボードとジャンパー  
ブレッドボードは、どんなものでも大丈夫だけど、小さすぎると、ブレイクアウトボードが、接続できないかもしれないから気を付けよう。  
あまり安すぎるやつは、接触不良になったりするから、お店の人や詳しい人に、おすすめを聞いてみるのも良いと思うよ！  
ジャンパーは、どんなに多くても10本あれば、大丈夫だよ。  
![Breadboard](image02.jpg)  

### マイクロビットとBME280をつないでみよう！
まず、マイクロビットとBME280 I2Cボードの2つの端子をつなごう。マイクロビットのブレイクアウトボードの"+3v3"と"GND"をつなぐよ。これは、マイクロビットから、BME280ボードに、電気をあげるためにつなぐんだ。ちょうど、電池のプラスとマイナスの役割をするところだよ。  
そのほかには、マイクロビットとBME280ボードと通信をするための端子を二つつなぐよ。名前は、"SCL"と"SDA"だよ。  
以下のリンクにマイクロビットのどの端子がどこにあるか全部書いてあるから、見てみてね。  
[マイクロビットの端子の説明](http://microbit.org/guide/hardware/pins/)  
ブレイクアウトボードを使ってるひとは、ブレイクアウトボードの基盤に書いてあるか、付属の説明書に書いてあるから確認しよう！  

そして、つなぐ相手のBME280ボードのほうは、みんな使ってるボードが違うから、どこにつなげば良いかは、ここでは説明できないんだ。だけど、ほとんどのBME280ボードは、下のような名前の端子があると思うから、そこにつなげばきっとうまくいくと思うよ。これも、わからないときは、周りの人に聞いてみよう！

1. マイクロビットの"+3v3"をBME280ボードの"VDD"に
2. マイクロビットの"GND"をBME280ボードの"GND"に
3. マイクロビットの"SDA"をBME280ボードの"SDI"に
4. マイクロビットの"SCL"をBME280ボードの"SCK"に


### My case
OK, then, let's see how my case was.

1. Insert micro:bit to the card edge connector of the breakout board.  
![proc01](proc01.jpg)  
2. Connect the breakout board to the breadboard.  
![proc02](proc02.jpg)  
3. Connect the BME280 board to the other hand of the breadboard.  
![proc03](proc03.jpg)  
4. Connect jumper pins to make the circuit described above.  
In my case, there were two more pins needed to connect to "GND" and "+3v3" respectively.  
The one was to select I2C address of BME280 board, which was 0x76. The other was to activate I2C bus.  
![proc04](proc04.jpg)  

### Let's code!
Finally we have prepared to use our BME280. Here is the step to get work the sensors.  

1. Open [https://makecode.microbit.org](https://makecode.microbit.org) on your browser.
2. Click gear icon and select "Add Package..."  
![code01](Capture.jpg)  
3. Enter the following URL to the text box.  
https://github.com/tksgmsy/pxt-BME280_I2C  
Unfortunately, this is not officially approved package, so you'll see that message.  
![code02](Capture02.jpg)  
4. Once you've successfully imported the package to your project, you'll see that new row on you block coding pane.  
![code03](Capture03.jpg)  
5. Lastly, here is my example code.  
![code04](Capture04.jpg)  
Notice that you must need to select proper I2C bus address of your BME280 in “Init” block, which should be either 0x76 or 0x77.  
If your BME280 is found on the I2C bus and initialized properly, “DeviceFound” block will return "true", otherwise return "false".
So, you can check it by looking into the icon after booting your micro:bit.  
When pressing "A", you'll see the temperature measured by BME280 in degrees celsius.  
When pressing "B", you'll see hundredfold of the temperature, which is to tell you the temperature with two decimal place.  
6. Have fun!  
There are other blocks to measure pressure and humidity, additionally to set some functionalities of BME280. I recommend you to check the data sheet of BME280 before using those blocks. You can find it from the following link.  
https://www.bosch-sensortec.com/bst/products/all_products/bme280
  
Hope you to enjoy your block coding life!  
By the way, this page and cusom package were written by a father of an elementary school boy in Japan for free research on summer vacation. :)
