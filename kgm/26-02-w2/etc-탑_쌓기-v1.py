T = int(input())
for tc in range(1,1+T):

    cost = []
    result = 0

    n, w1, w2 = map(int, input().split())       
    weight = list(map(int, input().split()))        # 화물의 무게를 담음

    for i in range(1,w1+1):             # 1부터 w1까지를 cost에 담음
        cost.append(i)

    for i in range(1,w2+1):             # 1부터 w2까지를 cost에 담음
        cost.append(i)

    cost.sort()                         # cost는 오름차순으로
    weight.sort(reverse=True)           # weight는 내림차순으로 정렬
    
    #비용이 가장 적게 들어가려면 무거운 화물이 아래에 가벼운 화물이 위로 가야한다.
    
    for i in range(n):                  
        result += cost[i] * weight[i]

    print(f'#{tc} {result}')