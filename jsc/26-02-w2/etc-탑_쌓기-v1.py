def solve():
    for tc in range(1, T + 1):
        N = int(input().strip())
        W1, W2 = map(int, input().split())
        weights = list(map(int, input().split()))

        weights.sort(reverse=True)
        tower1 = 1 #  현재 타워에 들어가야할 인덱스
        tower2 = 1 #  현재 타워에 들어가야할 인덱스
        total_cost = 0
        
        #  케이스별로 투입 위치 정하기
        for w in weights:
            #  둘다 공간 남음
            if tower1 <= W1 and tower2 <= W2:
                if tower1 <= tower2:
                    total_cost += w * tower1
                    tower1 += 1
                else:
                    total_cost += w * tower2
                    tower2 += 1  
            #  1만 남음          
            elif tower1 <= W1:
                total_cost += w * tower1
                tower1 += 1
            #  2만 남음
            elif tower2 <= W2:
                total_cost += w * tower2
                tower2 += 1
        
        print(f"#{tc} {total_cost}")

solve()