# datter

![](https://raw.githubusercontent.com/lachenmayer/datter/master/screenshot.png)

twitter on dat proof of concept for use in browser - does not work unfortunately, but making it public anyway because the concepts could be useful.

the main issue is finding peers with webrtc - it sometimes just doesn't work, and is really hard to debug.
[webrtc-swarm](https://npm.im/webrtc-swarm) also relies on a [signalhub](https://npm.im/signalhub), which means that you can't find peers on the local network without an internet connection :(
using [beaker browser](https://beakerbrowser.com/) would solve that, but unfortunately beaker only exposes the dat apis.
it would be amazing if beaker exposed a [discovery-swarm](https://npm.im/discovery-swarm) api - the only thing that stops dat/hypercore from working in the browser is peer discovery, and this would open up the possibilities for a lot of non-dat (ie. [hyperdrive](https://npm.im/hyperdrive)/file-based) apps.

every user is modelled as a [hypercore](https://npm.im/hypercore), which contains:
- the user's messages
- 'follow' messages

this hypercore could also contain further user-specific stuff, like profile information, private encrypted messages, or any other message type that could be useful.

to follow someone, you have to paste the user hypercore's public key in the textbox at the top of the screen.
the app will start replicating that user's hypercore feed.
keys are color coded to make typos obvious.

the app will also start replicating any feeds mentioned in 'follow' messages in feeds you follow, similar to [scuttlebutt](https://www.scuttlebutt.nz/).
this lets you see messages from friends of friends, which you can then follow without having to type in their key.
