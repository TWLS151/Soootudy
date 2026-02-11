T = int(input())

for test_case in range(1, T + 1):
    N = int(input())
    carrot = list(map(int, input().split()))        
    carrot.sort()                   # 당근을 오름 차순으로 정렬
    carrot_cnt = {}
    # 크기에 따른 당근을 딕셔너리로 저장
    for i in carrot:
        if i in carrot_cnt.keys():
            carrot_cnt[i] += 1
        else:
            carrot_cnt[i] = 1
    carrot_lit = []
    # 당근의 갯수를 lit으로 저장
    for cnt in carrot_cnt.values():
        carrot_lit.append(cnt)
    
    length = len(carrot_lit)
    result = []
    # 당근의 갯수를 알았으니 갯수들의 모든 조합을 측정, result 리스트에 저장
    for i in range(1, length - 1):
        for z in range(i + 1, length):
            if sum(carrot_lit[0:i]) > N / 2 or sum(carrot_lit[i:z]) > N / 2 or sum(carrot_lit[z:]) > N / 2:
                pass

            else:
                max_num = max(sum(carrot_lit[0:i]), sum(carrot_lit[i:z]), sum(carrot_lit[z:]))
                min_num = min(sum(carrot_lit[0:i]), sum(carrot_lit[i:z]), sum(carrot_lit[z:]))
                result.append(max_num - min_num)
    # result에 아무것도 저장이 안되면 -1, 그게 아니라면 result 값 중 가장 작은 값을 출력
    if len(result) == 0:
        print(f'#{test_case} -1')
    else:
        print(f'#{test_case} {min(result)}')