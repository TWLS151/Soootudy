### 못푼 코드입니다. 참고용입니다.


T=int(input())

for tc in range(1,1+T):
    N = int(input())
    trees = list(map(int, input().split()))
    max_height=max(trees)
    even=0
    odd=0

    for tree in trees:
        temp = max_height - tree
        even += temp //2
        if temp % 2 == 1:
            odd +=1

    while even > odd:
        even-=1
        odd +=2

    if odd > even and even !=0:
        print(f'#{tc} {odd*2 -1}')
    else:
        print(f'#{tc} {even*2}')
